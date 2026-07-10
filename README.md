# SACOM · Módulo Free Account

Panel de gestión de negocios ("Mis Negocios") construido con Angular. La aplicación se sirve bajo el path base **`/mis-negocios/`**.

## Stack tecnológico

| Tecnología | Versión |
|------------|---------|
| Angular / Angular CLI | 22.0.x |
| TypeScript | 6.0.x |
| RxJS | 7.8.x |
| Zone.js | 0.15.x |
| Angular CDK | 22.0.x |
| Chart.js + ng2-charts | 4.5.x / 10.0.x |
| @angular/google-maps + @types/google.maps | 22.0.x / 3.65.x |
| @ng-icons (core + heroicons) | 33.2.x |
| Karma + Jasmine (unit tests) | 6.4.x / 5.x |

**Requisitos:** Node.js 20.19+ (o 22+) y npm. Angular 22 no es compatible con versiones impares/no-LTS de Node.

## Puesta en marcha

```bash
npm install
npm start        # equivale a `ng serve`
```

Por el path base configurado, abre el navegador en:

```
http://localhost:4200/mis-negocios/
```

La aplicación recarga automáticamente al modificar los archivos fuente.

## Scripts disponibles

```bash
npm start        # servidor de desarrollo (ng serve)
npm run build    # build de producción en dist/
npm run watch    # build de desarrollo en modo watch
npm test         # unit tests con Karma + Jasmine
```

## Convención de scaffolding

Todo componente, servicio, guard o módulo se genera con Angular CLI (no se crean manualmente):

```bash
ng generate component features/mi-feature/mi-componente
ng generate service core/services/mi-servicio
ng generate module features/mi-feature --routing
```

> Nota: Angular 22 genera los stubs con la nueva convención de nombres (p. ej. `mi-servicio.ts` / clase `MiServicio`). En este repo los servicios se ajustan a `@Injectable({ providedIn: 'root' })`.

## Arquitectura

Organización por capas dentro de `src/app`:

```
core/        Modelos, servicios transversales y guards
  models/    Interfaces (User, AuthResponse, metrics, ...)
  services/  AuthApi (contrato + http/mock), AuthMockService, metrics
  guards/    authGuard
domain/      Reglas de negocio puras (entidades, políticas, validaciones)
data/        Acceso a datos (repositorios http/mock + mappers)
features/    Módulos lazy por funcionalidad
  login/           Login y validación por token (/login, /validacion/:token)
  otp/             Callback de OTP (/otp/callback)
  no-autorizado/   Pantalla de acceso no autorizado (/no-autorizado)
  dashboard/       Métricas, negocios, seguridad
  crear-contrasena/
shared/      Componentes reutilizables
styles/      Sistema de diseño (variables, mixins, tipografía)
```

### Patrón de inyección con mocks

Mientras la API real no está disponible se usan implementaciones mock intercambiables por DI (mismo patrón para negocios y auth):

```ts
// app.module.ts
{ provide: BUSINESS_REPOSITORY, useClass: BusinessMockRepository }
{ provide: AUTH_API, useClass: AuthApiMock }   // → cambiar a AuthApiHttp con la API real
```

El contrato (`AuthApi`, `BusinessRepository`) vive junto a sus implementaciones `*Http` y `*Mock`; los componentes dependen solo del contrato.

## Configuración de entornos

Las variables viven en `src/environments/`:

```ts
// environment.ts / environment.prod.ts
export const environment = {
  production: false,
  googleMapsApiKey: '...',
  API_URI: 'http://10.34.7.172:4300/api'
};
```

El build de producción reemplaza `environment.ts` por `environment.prod.ts`.

## Rutas principales

| Ruta | Descripción |
|------|-------------|
| `/mis-negocios/login` | Inicio de sesión (OTP por correo) |
| `/mis-negocios/validacion/:token` | Prellena el email desde el token y guarda el `leadid` |
| `/mis-negocios/otp/callback?code=...` | Valida el OTP: 200 → dashboard, error → no autorizado |
| `/mis-negocios/no-autorizado` | Acceso no autorizado |
| `/mis-negocios/dashboard/...` | Panel (protegido por `authGuard`) |

## Build

```bash
npm run build
```

Los artefactos se generan en `dist/sacom-free-account/`. El `baseHref` (`/mis-negocios/`) queda embebido en el `index.html`; al desplegar detrás de un reverse proxy, configúralo para hacer fallback a `index.html` dentro de `/mis-negocios/` (necesario para deep links y refresh del routing de Angular).

## Recursos

- [Angular CLI — referencia de comandos](https://angular.dev/tools/cli)
- [Angular Docs](https://angular.dev)
