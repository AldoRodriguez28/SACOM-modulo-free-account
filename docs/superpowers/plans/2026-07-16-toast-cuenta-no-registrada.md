# Toast reutilizable + mensaje "cuenta no registrada" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar al usuario del login un toast (con el mensaje del backend, p.ej. "cuenta no registrada" ante un 404) mediante un componente/servicio de toast reutilizable en toda la app.

**Architecture:** Un `ToastService` con estado en signal expone `error/success/info/dismiss`; un `ToastComponent` global (montado en el root) renderiza la pila leyendo el signal. El `Login.onSubmit()` dispara `toast.error` en su handler de error extrayendo el `detail`/`title` del ProblemDetails.

**Tech Stack:** Angular (módulos NgModule, `standalone: false`), signals, Karma + Jasmine (`ng test`), SCSS con variables del proyecto.

## Global Constraints

- Todo componente/servicio/guard se crea con `ng generate`, **nunca** a mano.
- Componentes `standalone: false` (coherente con el proyecto).
- Estilos con variables de `src/styles/_variables.scss`: `$color-danger` #DC2626, `$color-danger-bg` #FEF2F2, `$color-success` #16A34A, `$color-success-bg` #F0FDF4, `$color-border` #E5E5E5, `$color-text` #1A1A1A, `$color-text-light` #666666, `$radius-lg` 12px, espaciados `$spacing-*`, pesos `$font-weight-*`.
- Comando de test: `ng test --watch=false --browsers=ChromeHeadless` (Karma/Jasmine). Para acotar: agregar `--include='**/<archivo>.spec.ts'`.
- Duración de auto-cierre por defecto: `5000` ms. Posición del toast: esquina superior derecha.
- Título fijo para el toast del login: `'Cuenta no registrada'`; fallback genérico: título `'No pudimos continuar'`, detalle `'Inténtalo de nuevo en unos momentos.'`.

---

### Task 1: ToastService (estado + API)

**Files:**
- Create: `src/app/shared/services/toast.service.ts` (vía `ng generate service shared/services/toast`)
- Test: `src/app/shared/services/toast.service.spec.ts` (generado por el CLI, se reemplaza su contenido)

**Interfaces:**
- Consumes: nada.
- Produces:
  - `export type ToastType = 'error' | 'success' | 'info';`
  - `export interface Toast { id: number; type: ToastType; text: string; detail?: string; duration: number; }`
  - `export const DEFAULT_TOAST_DURATION = 5000;`
  - `class ToastService` con:
    - `readonly toasts: Signal<Toast[]>` (readonly del signal interno)
    - `error(text: string, detail?: string): number`
    - `success(text: string, detail?: string): number`
    - `info(text: string, detail?: string): number`
    - `dismiss(id: number): void`

- [ ] **Step 1: Generar el servicio con Angular CLI**

Run:
```bash
npx ng generate service shared/services/toast --skip-tests=false
```
Expected: crea `src/app/shared/services/toast.service.ts` y `toast.service.spec.ts`. (Si el CLI pregunta por sobrescritura, aceptar solo para estos archivos nuevos.)

- [ ] **Step 2: Escribir los tests que fallan**

Reemplazar el contenido de `src/app/shared/services/toast.service.spec.ts` con:
```ts
import { fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    service = new ToastService();
  });

  it('error() agrega un toast de tipo error con text y detail', () => {
    service.error('Cuenta no registrada', 'No existe una cuenta con ese correo.');
    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('error');
    expect(toasts[0].text).toBe('Cuenta no registrada');
    expect(toasts[0].detail).toBe('No existe una cuenta con ese correo.');
  });

  it('success() e info() agregan toasts con su tipo', () => {
    service.success('Listo');
    service.info('Dato');
    const types = service.toasts().map(t => t.type);
    expect(types).toEqual(['success', 'info']);
  });

  it('dismiss() remueve el toast por id', () => {
    const id = service.error('X');
    expect(service.toasts().length).toBe(1);
    service.dismiss(id);
    expect(service.toasts().length).toBe(0);
  });

  it('auto-cierra el toast tras la duración por defecto', fakeAsync(() => {
    service.error('X');
    expect(service.toasts().length).toBe(1);
    tick(5000);
    expect(service.toasts().length).toBe(0);
  }));
});
```

- [ ] **Step 3: Ejecutar los tests para verificar que fallan**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/toast.service.spec.ts'`
Expected: FAIL (métodos `error/success/info/dismiss`/`toasts` no existen).

- [ ] **Step 4: Implementar el servicio**

Reemplazar el contenido de `src/app/shared/services/toast.service.ts` con:
```ts
import { Injectable, Signal, signal } from '@angular/core';

export type ToastType = 'error' | 'success' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  text: string;
  detail?: string;
  duration: number;
}

export const DEFAULT_TOAST_DURATION = 5000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts: Signal<Toast[]> = this._toasts.asReadonly();

  private nextId = 1;

  error(text: string, detail?: string): number {
    return this.show('error', text, detail);
  }

  success(text: string, detail?: string): number {
    return this.show('success', text, detail);
  }

  info(text: string, detail?: string): number {
    return this.show('info', text, detail);
  }

  dismiss(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private show(type: ToastType, text: string, detail?: string): number {
    const id = this.nextId++;
    const toast: Toast = { id, type, text, detail, duration: DEFAULT_TOAST_DURATION };
    this._toasts.update(list => [...list, toast]);
    if (toast.duration > 0) {
      setTimeout(() => this.dismiss(id), toast.duration);
    }
    return id;
  }
}
```

- [ ] **Step 5: Ejecutar los tests para verificar que pasan**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/toast.service.spec.ts'`
Expected: PASS (4 specs).

- [ ] **Step 6: Commit**

```bash
git add src/app/shared/services/toast.service.ts src/app/shared/services/toast.service.spec.ts
git commit -m "feat(shared): ToastService con estado en signal y auto-cierre"
```

---

### Task 2: ToastComponent (render de la pila)

**Files:**
- Create: `src/app/shared/components/toast/toast.component.{ts,html,scss}` (vía `ng generate component shared/components/toast`)
- Test: `src/app/shared/components/toast/toast.component.spec.ts` (generado por el CLI, se reemplaza)
- Modify: `src/app/shared/shared.module.ts` (declarar + exportar `ToastComponent`)

**Interfaces:**
- Consumes de Task 1: `ToastService` (`toasts()` signal), `Toast`, `ToastType`.
- Produces: componente con selector `app-toast`; `class ToastComponent` con `readonly toasts = this.toast.toasts` y método `close(id: number): void` que llama `toast.dismiss(id)`.

- [ ] **Step 1: Generar el componente con Angular CLI**

Run:
```bash
npx ng generate component shared/components/toast --module=shared/shared.module --export --skip-tests=false
```
Expected: crea los 4 archivos del componente y lo declara/exporta en `SharedModule`. (Si el flag `--module`/`--export` no aplica el cambio, se corrige manualmente en el Step 6.)

- [ ] **Step 2: Escribir el test que falla**

Reemplazar el contenido de `src/app/shared/components/toast/toast.component.spec.ts` con:
```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { ToastService } from '../../services/toast.service';

describe('ToastComponent', () => {
  let fixture: ComponentFixture<ToastComponent>;
  let toast: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ToastComponent],
      providers: [ToastService],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    toast = TestBed.inject(ToastService);
  });

  it('renderiza un toast con su texto y clase de tipo', () => {
    toast.error('Cuenta no registrada', 'Detalle');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const item = el.querySelector('.toast');
    expect(item).toBeTruthy();
    expect(item!.classList).toContain('toast--error');
    expect(el.textContent).toContain('Cuenta no registrada');
    expect(el.textContent).toContain('Detalle');
  });

  it('el botón cerrar remueve el toast', () => {
    toast.error('X');
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.toast__close');
    btn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.toast')).toBeNull();
  });
});
```

- [ ] **Step 3: Ejecutar el test para verificar que falla**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/toast.component.spec.ts'`
Expected: FAIL (no existe `.toast`/`close`).

- [ ] **Step 4: Implementar el componente**

`src/app/shared/components/toast/toast.component.ts`:
```ts
import { Component } from '@angular/core';
import { Toast, ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: false,
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  readonly toasts = this.toast.toasts;

  constructor(private toast: ToastService) {}

  close(id: number): void {
    this.toast.dismiss(id);
  }

  trackById(_index: number, item: Toast): number {
    return item.id;
  }
}
```

`src/app/shared/components/toast/toast.component.html`:
```html
<div class="toast-stack" aria-live="polite" aria-atomic="true">
  <div
    *ngFor="let t of toasts(); trackBy: trackById"
    class="toast"
    [class.toast--error]="t.type === 'error'"
    [class.toast--success]="t.type === 'success'"
    [class.toast--info]="t.type === 'info'"
    role="alert"
  >
    <span class="toast__icon" aria-hidden="true">
      <ng-container [ngSwitch]="t.type">
        <ng-container *ngSwitchCase="'error'">&#9888;</ng-container>
        <ng-container *ngSwitchCase="'success'">&#10003;</ng-container>
        <ng-container *ngSwitchDefault>&#8505;</ng-container>
      </ng-container>
    </span>
    <div class="toast__body">
      <p class="toast__text">{{ t.text }}</p>
      <p class="toast__detail" *ngIf="t.detail">{{ t.detail }}</p>
    </div>
    <button
      type="button"
      class="toast__close"
      aria-label="Cerrar notificación"
      (click)="close(t.id)"
    >&times;</button>
  </div>
</div>
```

`src/app/shared/components/toast/toast.component.scss`:
```scss
@use 'styles/variables' as *;

.toast-stack {
  position: fixed;
  top: $spacing-md;
  right: $spacing-md;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  max-width: 360px;
  width: calc(100% - #{$spacing-lg});
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  padding: 12px 14px;
  border-radius: $radius-lg;
  border-left: 4px solid $color-border;
  background: $color-white;
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
  animation: toast-in 0.2s ease-out;

  &--error {
    border-left-color: $color-danger;
    background: $color-danger-bg;
  }
  &--success {
    border-left-color: $color-success;
    background: $color-success-bg;
  }
  &--info {
    border-left-color: $color-border;
    background: $color-white;
  }

  &__icon {
    font-size: 16px;
    line-height: 1.4;
    color: $color-text;
  }

  &__body { flex: 1; }

  &__text {
    margin: 0;
    font-size: 13px;
    font-weight: $font-weight-bold;
    color: $color-text;
  }

  &__detail {
    margin: 2px 0 0;
    font-size: 12px;
    color: $color-text-light;
    line-height: 1.4;
  }

  &__close {
    background: none;
    border: none;
    font-size: 18px;
    line-height: 1;
    color: $color-text-light;
    cursor: pointer;
    padding: 0 2px;
    &:hover { color: $color-text; }
  }
}

@keyframes toast-in {
  from { opacity: 0; transform: translateX(12px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

- [ ] **Step 5: Ejecutar el test para verificar que pasa**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/toast.component.spec.ts'`
Expected: PASS (2 specs).

- [ ] **Step 6: Verificar/ajustar `SharedModule`**

Confirmar que `src/app/shared/shared.module.ts` declara `ToastComponent` y lo incluye en `exports`. Debe quedar así:
```ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PasswordStrengthComponent } from './components/password-strength/password-strength.component';
import { ToastComponent } from './components/toast/toast.component';

@NgModule({
  declarations: [PasswordStrengthComponent, ToastComponent],
  imports: [CommonModule],
  exports: [PasswordStrengthComponent, ToastComponent, CommonModule],
})
export class SharedModule {}
```

- [ ] **Step 7: Commit**

```bash
git add src/app/shared/components/toast src/app/shared/shared.module.ts
git commit -m "feat(shared): ToastComponent y registro en SharedModule"
```

---

### Task 3: Montaje global del toast en el root

**Files:**
- Modify: `src/app/app.module.ts` (importar `SharedModule`)
- Modify: `src/app/app.component.html` (montar `<app-toast>`)

**Interfaces:**
- Consumes de Task 2: `SharedModule` (exporta `ToastComponent` con selector `app-toast`).
- Produces: `<app-toast>` disponible en el árbol raíz de la app.

- [ ] **Step 1: Importar SharedModule en AppModule**

En `src/app/app.module.ts`, agregar el import y añadir `SharedModule` al arreglo `imports`:
```ts
import { SharedModule } from './shared/shared.module';
```
`imports` queda:
```ts
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    SharedModule
  ],
```

- [ ] **Step 2: Montar el componente en el root**

Reemplazar el contenido de `src/app/app.component.html` con:
```html
<router-outlet></router-outlet>
<app-toast></app-toast>
```

- [ ] **Step 3: Verificar compilación y suite existente**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/app.component.spec.ts'`
Expected: PASS (el `AppComponent` compila con `app-toast` en su plantilla; si el spec de AppComponent no importa SharedModule, agregarlo a su `TestBed` imports).

- [ ] **Step 4: Commit**

```bash
git add src/app/app.module.ts src/app/app.component.html
git commit -m "feat: montar app-toast en el root e importar SharedModule"
```

---

### Task 4: Disparar el toast desde el login ante error

**Files:**
- Modify: `src/app/features/login/login/login.ts` (inyectar `ToastService`, disparar en handler de error)
- Modify: `src/app/features/login/login-module.ts` (importar `SharedModule`)
- Test: `src/app/features/login/login/login.spec.ts` (agregar specs de error 404 y fallback)

**Interfaces:**
- Consumes de Task 1: `ToastService.error(text, detail?)`.
- Produces: comportamiento observable — ante error de `getOtpUrl`, `Login` llama `toast.error(...)` y pone `loading = false`.

- [ ] **Step 1: Escribir los tests que fallan**

En `src/app/features/login/login/login.spec.ts`, hacer estos cambios:

(a) Añadir imports al inicio (junto a los existentes):
```ts
import { throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../../shared/services/toast.service';
```

(b) Añadir un nuevo `describe` al final del archivo:
```ts
describe('Login: manejo de error al pedir OTP', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let toast: ToastService;

  function configure(api: AuthApi) {
    return TestBed.configureTestingModule({
      declarations: [Login],
      imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [
        AuthMockService,
        ToastService,
        { provide: AUTH_API, useValue: api },
      ],
    }).compileComponents();
  }

  it('ante 404 muestra toast con el detail del backend', async () => {
    const api = new AuthApiMockStub();
    spyOn(api, 'getOtpUrl').and.returnValue(
      throwError(() => new HttpErrorResponse({
        status: 404,
        error: { title: 'No encontrado', status: 404, detail: 'No existe una cuenta registrada con ese correo.' },
      })),
    );
    await configure(api);
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();

    component.form.setValue({ email: 'nadie@ejemplo.com' });
    const spy = spyOn(toast, 'error').and.callThrough();
    component.onSubmit();

    expect(spy).toHaveBeenCalledWith('Cuenta no registrada', 'No existe una cuenta registrada con ese correo.');
    expect(component.loading).toBeFalse();
  });

  it('ante error sin detail usa el fallback genérico', async () => {
    const api = new AuthApiMockStub();
    spyOn(api, 'getOtpUrl').and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500, error: null })),
    );
    await configure(api);
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();

    component.form.setValue({ email: 'x@ejemplo.com' });
    const spy = spyOn(toast, 'error').and.callThrough();
    component.onSubmit();

    expect(spy).toHaveBeenCalledWith('No pudimos continuar', 'Inténtalo de nuevo en unos momentos.');
  });
});
```

- [ ] **Step 2: Ejecutar los tests para verificar que fallan**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/login.spec.ts'`
Expected: FAIL (el `Login` aún no inyecta `ToastService` → error de DI o `toast.error` no llamado).

- [ ] **Step 3: Inyectar ToastService y disparar el toast**

En `src/app/features/login/login/login.ts`:

(a) Agregar import:
```ts
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../../shared/services/toast.service';
```

(b) Añadir el parámetro al constructor (después de `cdr`):
```ts
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthMockService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    @Inject(AUTH_API) private authApi: AuthApi
  ) {}
```

(c) Reemplazar el handler `error` de `onSubmit()`:
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
        },
```

- [ ] **Step 4: Importar SharedModule en LoginModule**

En `src/app/features/login/login-module.ts`:
```ts
import { SharedModule } from '../../shared/shared.module';
```
`imports` queda:
```ts
  imports: [CommonModule, ReactiveFormsModule, LoginRoutingModule, SharedModule],
```

- [ ] **Step 5: Ejecutar los tests para verificar que pasan**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/login.spec.ts'`
Expected: PASS (specs existentes + los 2 nuevos).

- [ ] **Step 6: Ejecutar la suite completa**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: PASS toda la suite.

- [ ] **Step 7: Commit**

```bash
git add src/app/features/login/login/login.ts src/app/features/login/login/login.spec.ts src/app/features/login/login-module.ts
git commit -m "feat(login): mostrar toast de cuenta no registrada ante error al pedir OTP"
```

---

## Self-Review

**Spec coverage:**
- ToastService (signal, error/success/info/dismiss, auto-cierre 5s) → Task 1. ✓
- ToastComponent (variantes de tipo, posición fixed, botón cerrar, estilos con variables) → Task 2. ✓
- Declarar/exportar en SharedModule → Task 2 Step 6. ✓
- Montaje global (`app-toast` en root + SharedModule en AppModule) → Task 3. ✓
- Integración en `Login.onSubmit()` con extracción de `detail`/`title` + fallback → Task 4. ✓
- `LoginModule` importa SharedModule → Task 4 Step 4. ✓
- Testing de service, component y login (404 + fallback) → Tasks 1, 2, 4. ✓
- Sin lógica hardcodeada por status → Task 4 usa `err.error.detail ?? err.error.title`. ✓

**Placeholder scan:** sin TBD/TODO; todos los steps incluyen código o comandos concretos. ✓

**Type consistency:** `ToastService.error(text, detail?)`, `toasts()` signal, `Toast.id/type/text/detail/duration`, selector `app-toast` — usados de forma consistente entre Task 1 (definición) y Tasks 2/4 (consumo). ✓
