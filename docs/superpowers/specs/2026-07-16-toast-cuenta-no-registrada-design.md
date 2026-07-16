# Toast reutilizable + mensaje "cuenta no registrada"

**Fecha:** 2026-07-16
**Rama:** feature-160726-agregando-alert-cuenta-no-registrada

## Contexto y problema

En `mis-negocios/login`, cuando el usuario envía el formulario, `Login.onSubmit()`
llama a `GET {API_URI}/Auth/otp/url`. Si el correo no está registrado, el backend
responde `404 Not Found` con un ProblemDetails:

```json
{
  "title": "No encontrado",
  "status": 404,
  "detail": "No existe una cuenta registrada con ese correo."
}
```

Hoy el handler `error` de `onSubmit()` (`src/app/features/login/login/login.ts:107`)
solo hace `this.loading = false` y **no comunica nada al usuario**. Ante un 404 (u
otro error) la UI simplemente se "desbloquea" sin explicación.

## Objetivo

Mostrar al usuario, mediante un **toast/notificación**, el motivo del fallo —para el
404, el mensaje "cuenta no registrada"— conservando los estilos y variables del
proyecto pero con presencia visual clara. La pieza debe ser **reutilizable** en toda
la app, no exclusiva del login.

## Alcance (YAGNI)

Incluye:
- Un `ToastService` y un `ToastComponent` reutilizables en `shared/`.
- Montaje global del `ToastComponent`.
- Integración en `Login.onSubmit()` para disparar el toast ante error.

No incluye:
- CTA "Regístrate" dentro del toast (el login ya tiene su link inferior).
- Lógica especial por código de status (se muestra el mensaje del backend).
- Cola/agrupación avanzada, persistencia, ni i18n.

## Decisiones de diseño (acordadas)

- Tratamiento visual: **toast/notificación** flotante.
- Construcción: **componente + servicio reutilizable** en `shared/`.
- Comportamiento: **auto-cierre** (~5s) + botón cerrar manual; **variantes de tipo**
  `error | success | info`.
- Sin distinción hardcodeada de 404: se muestra el `detail`/`title` del ProblemDetails.

## Arquitectura

Tres piezas, todas generadas con Angular CLI (`ng generate`, nunca a mano):

### 1. `ToastService` — `src/app/shared/services/toast.service.ts`

Generado con `ng generate service shared/services/toast`.

Responsabilidad: mantener el estado de los toasts activos y exponer una API para
crearlos/cerrarlos. No conoce nada de la UI.

- Estado con **signal** (compatible con ejecución zoneless, igual que el login que ya
  evita depender de zone.js):
  ```ts
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  ```
- Modelo:
  ```ts
  export type ToastType = 'error' | 'success' | 'info';
  export interface Toast {
    id: number;
    type: ToastType;
    text: string;        // título / línea principal
    detail?: string;     // detalle opcional (p.ej. el detail del ProblemDetails)
    duration: number;    // ms; 0 = no auto-cerrar
  }
  ```
- API pública:
  - `error(text: string, detail?: string): void`
  - `success(text: string, detail?: string): void`
  - `info(text: string, detail?: string): void`
  - `dismiss(id: number): void`
  - privado `show(partial): number` (asigna `id` incremental, agrega al signal,
    programa `setTimeout(() => dismiss(id), duration)` si `duration > 0`).
- Duración por defecto: `5000` ms (constante `DEFAULT_DURATION`).

### 2. `ToastComponent` — `src/app/shared/components/toast/`

Generado con `ng generate component shared/components/toast`.

Responsabilidad: renderizar la pila de toasts que expone el servicio.

- Inyecta `ToastService` y lee `toast.toasts()` en la plantilla.
- Selector: `app-toast`. `standalone: false` (coherente con el resto del proyecto).
- Plantilla: contenedor `fixed` en la esquina superior derecha; `@for` sobre los
  toasts con `track id`; cada toast muestra ícono según `type`, `text`, `detail`
  opcional y botón `×` que llama a `toast.dismiss(id)`.
- Estilos (`toast.component.scss`) usando variables del proyecto:
  - error → borde/acento `$color-danger` (#DC2626), fondo `$color-danger-bg`.
  - success → `$color-success`, fondo `$color-success-bg`.
  - info → neutro: borde `$color-border`, texto `$color-text-light`.
  - Radio `$radius-lg`, sombra equivalente a la card del login, tipografía y pesos
    del proyecto. Animación de entrada/salida suave (fade + slide).
- Se **declara y exporta** en `SharedModule`.

### 3. Montaje global

- `src/app/app.component.html`: agregar `<app-toast></app-toast>` junto al
  `<router-outlet>`.
- `src/app/app.module.ts`: importar `SharedModule` (hoy no lo importa) para que
  `app-toast` esté disponible en el árbol raíz.

## Flujo del error (integración en login)

En `src/app/features/login/login/login.ts`:

- Inyectar `ToastService`.
- Cambiar la firma del callback de error para recibir el `HttpErrorResponse` y
  extraer el mensaje del ProblemDetails:
  ```ts
  error: (err: HttpErrorResponse) => {
    this.loading = false;
    const detail = err?.error?.detail ?? err?.error?.title;
    if (detail) {
      this.toast.error('Cuenta no registrada', detail);
    } else {
      this.toast.error('No pudimos continuar', 'Inténtalo de nuevo en unos momentos.');
    }
    this.cdr.markForCheck();
  }
  ```
  Nota: el título "Cuenta no registrada" es adecuado para el 404 (caso objetivo). Para
  errores no-404 que sí traigan `detail`, se mostrará ese `detail`; el título genérico
  es aceptable dado el alcance. (Si más adelante se quiere un título por status, se
  hará en una iteración aparte.)
- `src/app/features/login/login-module.ts`: importar `SharedModule`.

## Manejo de errores

- El `detail`/`title` puede venir `undefined` (errores de red, 500 sin cuerpo): se usa
  el fallback genérico.
- `duration = 0` permite toasts que no se auto-cierran (no usado por ahora, pero la
  API lo soporta).

## Testing

- `toast.service.spec.ts` (generado por CLI, se completa):
  - `error()/success()/info()` agregan un toast con el `type` correcto.
  - `dismiss(id)` lo remueve del signal.
  - auto-cierre: con `fakeAsync`/`tick`, tras `duration` el toast desaparece.
- `toast.component.spec.ts`:
  - renderiza N toasts del servicio; aplica clase de tipo correcta; el botón `×`
    invoca `dismiss`.
- `login.spec.ts` (actualizar):
  - ante error 404 del `getOtpUrl`, se llama a `toast.error` con el `detail`.
  - ante error sin `detail`, se llama al fallback genérico.

## Archivos afectados

Nuevos (vía `ng generate`):
- `src/app/shared/services/toast.service.ts` (+ spec)
- `src/app/shared/components/toast/toast.component.{ts,html,scss}` (+ spec)

Modificados:
- `src/app/shared/shared.module.ts` — declarar/exportar `ToastComponent`.
- `src/app/app.module.ts` — importar `SharedModule`.
- `src/app/app.component.html` — montar `<app-toast>`.
- `src/app/features/login/login-module.ts` — importar `SharedModule`.
- `src/app/features/login/login/login.ts` — inyectar `ToastService`, disparar toast en
  el handler de error.
- `src/app/features/login/login/login.spec.ts` — cobertura del caso 404/fallback.
