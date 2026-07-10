# Diseño: validación de token contra el endpoint real de Token

**Fecha:** 2026-07-06
**Rama:** feature-020726-recibir-informacion-by-token

## Objetivo

Cuando el usuario llega a `/mis-negocios/validacion/{token}`, la app debe llamar al
endpoint real `GET https://test-servicios.adn.com.mx/sharedmanagement/api/Token/{token}`,
mapear la respuesta y con ella:

1. Autollenar el `email` en el input de login.
2. Guardar el `LeadId` en `sessionStorage`.
3. Guardar el `user_name` en `sessionStorage`.

No se realizan validaciones adicionales (no se evalúa `status`, `role` ni
`expiration_date`) ni redirecciones a `/no-autorizado`.

## Contexto actual

- `/mis-negocios/` es el `baseHref` (`angular.json`, `index.html`). La ruta Angular
  `validacion/:token` (en `login-routing-module.ts`) resuelve al componente `Login`,
  por lo que `/mis-negocios/validacion/{token}` ya invoca `Login.validarToken(token)`.
- `AUTH_API` está inyectado hoy como `AuthApiMock` (decodifica un JWT / datos demo).
- `AuthApiHttp.loginByToken` **no** coincide con el endpoint real: hace
  `POST ${API_URI}/Auth/login-by-token` con `{ token }` contra otro backend
  (`http://10.34.7.172:4300/api`).

## Respuesta real del endpoint

`GET https://test-servicios.adn.com.mx/sharedmanagement/api/Token/55F56BA198DDAB19E060220A55073911`

```json
{
    "token": "55F56BA198DDAB19E060220A55073911",
    "user_Id": "",
    "source": "SACOM-NEGOCIOS",
    "user_source_id": "SACOM_PORTAL",
    "ctcr_sys_dt": "2026-07-06T16:40:28",
    "ctcr_access_dt": "0001-01-01T00:00:00",
    "system_info": "{\"email\":\"aldo@gmail.com\",\"LeadId\":566171}",
    "user_name": "ALDO DE JESUS RODRIGUEZ RONQUILLO  ",
    "advertiser_id": "",
    "bc_product_id": 0,
    "case_id": 0,
    "id_cotizacion": "",
    "status": 1,
    "role": "CLIENTE-NEGOCIOS",
    "expiration_date": "2026-07-06T16:50:40",
    "origin_system": "SACOM-PORTAL"
}
```

Notas clave del contrato:
- `system_info` llega como **string JSON** que contiene `email` y `LeadId`.
- `user_name` puede traer espacios sobrantes al final (aplicar `.trim()`).
- El `token` es un valor opaco (no es un JWT decodificable).

## Diseño

### 1. Configuración de entorno

El endpoint Token vive en un host distinto de `API_URI`. Se agrega una nueva
propiedad a `src/environments/environment.ts` y `environment.prod.ts`:

```ts
SHARED_MGMT_URI: 'https://test-servicios.adn.com.mx/sharedmanagement/api'
```

### 2. Modelos (`src/app/core/models/auth-response.model.ts`)

- Nueva interfaz `TokenValidationResponse` que describe la respuesta cruda del
  endpoint (los campos que consumimos; `system_info` tipado como `string`).
- Extender `AuthResponse` con `userName?: string`.

### 3. `AuthApiHttp.loginByToken` (`src/app/core/services/auth-api-http.ts`)

Reemplazar la implementación por:

```ts
loginByToken(token: string): Observable<AuthResponse> {
  const url = `${environment.SHARED_MGMT_URI}/Token/${token}`;
  return this.http.get<TokenValidationResponse>(url).pipe(
    map(raw => this.mapTokenResponse(raw))
  );
}
```

`mapTokenResponse`:
- Parsear `raw.system_info` (string JSON) de forma segura (try/catch → `{}`).
- `email` = `parsed.email`.
- `leadId` = `parsed.LeadId != null ? String(parsed.LeadId) : undefined`.
- `userName` = `raw.user_name?.trim()`.
- `token` = `raw.token`.
- `systemInfo` = `{ email }` cuando hay email.

`validateOtp` no cambia.

### 4. Componente `Login` (`src/app/features/login/login/login.ts`)

- Nueva constante exportada `USER_NAME_KEY = 'sa_user_name'`.
- En `validarToken`, tras recibir la respuesta y además de las acciones actuales
  (autollenar email, guardar `LEAD_ID_KEY`), persistir:
  `if (res.userName) sessionStorage.setItem(USER_NAME_KEY, res.userName);`

### 5. Provider (`src/app/app.module.ts`)

Cambiar `{ provide: AUTH_API, useClass: AuthApiMock }` por
`{ provide: AUTH_API, useClass: AuthApiHttp }`.

**Efecto colateral aceptado:** `AUTH_API` es compartido; al activar `AuthApiHttp`
el flujo OTP (`callback.ts` → `validateOtp`) también pasa a pegarle al backend real
(`${API_URI}/Auth/otp/callback`). No se modifica ese código; solo se documenta el
cambio de comportamiento.

## Tests

- `auth-api-http.spec.ts`: con `HttpTestingController`, verificar que `loginByToken`
  hace `GET` a `${SHARED_MGMT_URI}/Token/{token}` y que el mapeo extrae correctamente
  `email` y `leadId` desde el `system_info` string, y `userName` con `.trim()`.
- `login.spec.ts`: verificar que tras la respuesta se persiste `sa_user_name` en
  `sessionStorage` (además de email y leadId).

## Riesgos

- **CORS.** El navegador llamando directo a `https://test-servicios.adn.com.mx`
  desde `localhost` puede requerir CORS habilitado en el backend o un
  `proxy.conf.json` en desarrollo. Si aparece, se resuelve con proxy; no altera
  el diseño.

## Fuera de alcance

- Validación de `status`, `role` o `expiration_date` y redirección a `/no-autorizado`.
- Mostrar el `user_name` en la UI (por ahora solo se persiste).
- Cambios al flujo OTP.
