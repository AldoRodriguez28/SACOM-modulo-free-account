# Validación de token contra endpoint real — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que `/mis-negocios/validacion/{token}` llame a `GET {SHARED_MGMT_URI}/Token/{token}`, mapee la respuesta y con ella autollene el email y guarde `LeadId` y `user_name` en `sessionStorage`.

**Architecture:** Se implementa la llamada real en `AuthApiHttp.loginByToken` (GET a un host distinto de `API_URI`) mapeando la respuesta cruda a `AuthResponse`. El componente `Login` persiste `user_name`. El provider `AUTH_API` se cambia de `AuthApiMock` a `AuthApiHttp`.

**Tech Stack:** Angular (módulos NgModule, standalone: false), RxJS, HttpClient, Karma + Jasmine.

## Global Constraints

- Nuevos componentes/servicios/guards se generan con `ng generate`, nunca a mano. (Este plan solo edita archivos existentes; no requiere `ng generate`.)
- Base URL del endpoint Token: `https://test-servicios.adn.com.mx/sharedmanagement/api` — host distinto de `API_URI` (`http://10.34.7.172:4300/api`).
- `system_info` llega como **string JSON** con `email` y `LeadId`.
- `user_name` puede traer espacios finales → aplicar `.trim()`.
- El `token` es opaco (no JWT).
- Comando de test single-run: `npx ng test --watch=false --browsers=ChromeHeadless`
- Cada commit termina con:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

---

### Task 1: Modelos y configuración de entorno

**Files:**
- Modify: `src/app/core/models/auth-response.model.ts`
- Modify: `src/environments/environment.ts`
- Modify: `src/environments/environment.prod.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `AuthResponse` con campo opcional `userName?: string`.
  - `TokenValidationResponse` interface (respuesta cruda del endpoint).
  - `environment.SHARED_MGMT_URI: string`.

- [ ] **Step 1: Agregar `SHARED_MGMT_URI` a `environment.ts`**

Reemplazar el contenido de `src/environments/environment.ts` por:

```ts
export const environment = {
  production: false,
  googleMapsApiKey: 'TU_API_KEY_AQUI',
  API_URI: 'http://10.34.7.172:4300/api',
  SHARED_MGMT_URI: 'https://test-servicios.adn.com.mx/sharedmanagement/api'
};
```

- [ ] **Step 2: Agregar `SHARED_MGMT_URI` a `environment.prod.ts`**

Reemplazar el contenido de `src/environments/environment.prod.ts` por:

```ts
export const environment = {
  production: true,
  googleMapsApiKey: 'TU_API_KEY_AQUI',
  API_URI: 'http://10.34.7.172:4300/api',
  SHARED_MGMT_URI: 'https://test-servicios.adn.com.mx/sharedmanagement/api'
};
```

- [ ] **Step 3: Extender los modelos**

Reemplazar el contenido de `src/app/core/models/auth-response.model.ts` por:

```ts
/** Información del sistema embebida en el token de validación. */
export interface SystemInfo {
  email: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  /** Token de sesión devuelto por el backend. */
  token: string;
  /** Identificador del lead asociado al enlace de validación. */
  leadId?: string;
  /** Datos extraídos del token (contiene el email, entre otros). */
  systemInfo?: SystemInfo;
  /** Nombre del usuario recibido en el token. */
  userName?: string;
  user?: {
    id: string;
    email: string;
    contactName?: string;
  };
}

/**
 * Respuesta cruda del endpoint `GET {SHARED_MGMT_URI}/Token/{token}`.
 * `system_info` es un string JSON que contiene `email` y `LeadId`.
 */
export interface TokenValidationResponse {
  token: string;
  user_Id?: string;
  source?: string;
  user_source_id?: string;
  system_info?: string;
  user_name?: string;
  advertiser_id?: string;
  status?: number;
  role?: string;
  expiration_date?: string;
  origin_system?: string;
}
```

- [ ] **Step 4: Verificar que compila**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/app/core/models/auth-response.model.ts src/environments/environment.ts src/environments/environment.prod.ts
git commit -m "feat: modelo TokenValidationResponse y SHARED_MGMT_URI

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `AuthApiHttp.loginByToken` real + mapeo (TDD)

**Files:**
- Modify: `src/app/core/services/auth-api-http.ts`
- Test: `src/app/core/services/auth-api-http.spec.ts`

**Interfaces:**
- Consumes: `TokenValidationResponse`, `AuthResponse`, `environment.SHARED_MGMT_URI` (Task 1).
- Produces: `AuthApiHttp.loginByToken(token: string): Observable<AuthResponse>` que hace `GET {SHARED_MGMT_URI}/Token/{token}` y devuelve un `AuthResponse` con `token`, `systemInfo.email`, `leadId` (string) y `userName` (trim).

- [ ] **Step 1: Escribir el test que falla**

Reemplazar el contenido de `src/app/core/services/auth-api-http.spec.ts` por:

```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '../../../environments/environment';
import { AuthApiHttp } from './auth-api-http';
import { AuthResponse } from '../models/auth-response.model';

describe('AuthApiHttp', () => {
  let service: AuthApiHttp;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthApiHttp);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('loginByToken hace GET al endpoint Token y mapea system_info y user_name', () => {
    const token = '55F56BA198DDAB19E060220A55073911';
    let result: AuthResponse | undefined;

    service.loginByToken(token).subscribe(r => (result = r));

    const req = httpMock.expectOne(`${environment.SHARED_MGMT_URI}/Token/${token}`);
    expect(req.request.method).toBe('GET');
    req.flush({
      token,
      system_info: '{"email":"aldo@gmail.com","LeadId":566171}',
      user_name: 'ALDO DE JESUS RODRIGUEZ RONQUILLO  ',
      role: 'CLIENTE-NEGOCIOS',
      status: 1,
    });

    expect(result!.token).toBe(token);
    expect(result!.systemInfo!.email).toBe('aldo@gmail.com');
    expect(result!.leadId).toBe('566171');
    expect(result!.userName).toBe('ALDO DE JESUS RODRIGUEZ RONQUILLO');
  });

  it('loginByToken tolera system_info vacío o inválido', () => {
    const token = 'sin-info';
    let result: AuthResponse | undefined;

    service.loginByToken(token).subscribe(r => (result = r));

    httpMock
      .expectOne(`${environment.SHARED_MGMT_URI}/Token/${token}`)
      .flush({ token, system_info: '', user_name: '' });

    expect(result!.token).toBe(token);
    expect(result!.systemInfo).toBeUndefined();
    expect(result!.leadId).toBeUndefined();
    expect(result!.userName).toBeUndefined();
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/auth-api-http.spec.ts'`
Expected: FAIL — el GET va a la URL vieja (`/Auth/login-by-token`) o no hay mapeo; `expectOne` no encuentra la request esperada.

- [ ] **Step 3: Implementar `loginByToken` con mapeo**

Reemplazar el contenido de `src/app/core/services/auth-api-http.ts` por:

```ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthApi } from './auth-api';
import { AuthResponse, TokenValidationResponse } from '../models/auth-response.model';

@Injectable({ providedIn: 'root' })
export class AuthApiHttp implements AuthApi {
  private readonly baseUrl = environment.API_URI;

  constructor(private http: HttpClient) {}

  loginByToken(token: string): Observable<AuthResponse> {
    const url = `${environment.SHARED_MGMT_URI}/Token/${token}`;
    return this.http
      .get<TokenValidationResponse>(url)
      .pipe(map(raw => this.mapTokenResponse(raw)));
  }

  validateOtp(code: string): Observable<AuthResponse> {
    const url = `${this.baseUrl}/Auth/otp/callback`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    const body = { code };
    return this.http.post<AuthResponse>(url, body, { headers });
  }

  /** Convierte la respuesta cruda del endpoint Token en un AuthResponse. */
  private mapTokenResponse(raw: TokenValidationResponse): AuthResponse {
    const info = this.parseSystemInfo(raw.system_info);
    const email = info['email'] ?? info['Email'];
    const leadId = info['LeadId'] ?? info['leadId'];
    const userName = raw.user_name?.trim();

    const response: AuthResponse = { token: raw.token };
    if (email) {
      response.systemInfo = { email: String(email) };
    }
    if (leadId != null) {
      response.leadId = String(leadId);
    }
    if (userName) {
      response.userName = userName;
    }
    return response;
  }

  /** `system_info` viene como string JSON; si no es parseable devuelve {}. */
  private parseSystemInfo(value: string | undefined): Record<string, any> {
    if (!value) return {};
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/auth-api-http.spec.ts'`
Expected: PASS (3 specs).

- [ ] **Step 5: Commit**

```bash
git add src/app/core/services/auth-api-http.ts src/app/core/services/auth-api-http.spec.ts
git commit -m "feat: loginByToken consume el endpoint real de Token y mapea la respuesta

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: `Login` persiste `user_name` (TDD)

**Files:**
- Modify: `src/app/features/login/login/login.ts`
- Test: `src/app/features/login/login/login.spec.ts`

**Interfaces:**
- Consumes: `AuthResponse.userName` (Task 1), `AuthApi.loginByToken` (Task 2).
- Produces: constante exportada `USER_NAME_KEY = 'sa_user_name'`; al validar el token, persiste `res.userName` en `sessionStorage[USER_NAME_KEY]`.

- [ ] **Step 1: Escribir el test que falla**

Reemplazar el contenido de `src/app/features/login/login/login.spec.ts` por:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Observable, of } from 'rxjs';

import { Login, USER_NAME_KEY, LEAD_ID_KEY } from './login';
import { AuthMockService } from '../../../core/services/auth.mock.service';
import { AUTH_API, AuthApi } from '../../../core/services/auth-api';
import { AuthResponse } from '../../../core/models/auth-response.model';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Login],
      imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [
        AuthMockService,
        { provide: AUTH_API, useClass: AuthApiMockStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('Login con token en la ruta', () => {
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      declarations: [Login],
      imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [
        AuthMockService,
        { provide: AUTH_API, useClass: AuthApiMockStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ token: 'tok-123' }) },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
  });

  it('persiste email, leadId y user_name tras validar el token', () => {
    const component = fixture.componentInstance;
    expect(component.form.get('email')!.value).toBe('aldo@gmail.com');
    expect(sessionStorage.getItem(LEAD_ID_KEY)).toBe('566171');
    expect(sessionStorage.getItem(USER_NAME_KEY)).toBe('ALDO RODRIGUEZ');
  });
});

/** Stub de AuthApi que devuelve una respuesta con userName. */
class AuthApiMockStub implements AuthApi {
  loginByToken(): Observable<AuthResponse> {
    return of<AuthResponse>({
      token: 'sess',
      leadId: '566171',
      systemInfo: { email: 'aldo@gmail.com' },
      userName: 'ALDO RODRIGUEZ',
    });
  }
  validateOtp(): Observable<AuthResponse> {
    return of<AuthResponse>({ token: 'sess' });
  }
}
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/login.spec.ts'`
Expected: FAIL — `USER_NAME_KEY` no existe todavía (error de compilación / import) y no se persiste `sa_user_name`.

- [ ] **Step 3: Implementar la persistencia en `Login`**

En `src/app/features/login/login/login.ts`:

Agregar la constante debajo de `LEAD_ID_KEY` (línea ~8):

```ts
/** Clave de sessionStorage donde se guarda el user_name recibido en el token */
export const USER_NAME_KEY = 'sa_user_name';
```

En el bloque `next` de `validarToken`, después de guardar el `leadId`, agregar la persistencia del userName. El bloque queda así:

```ts
      next: (res) => {
        this.loading = false;
        const email = res.systemInfo?.email ?? res.user?.email;
        if (email) {
          this.form.patchValue({ email });
        }
        if (res.leadId) {
          sessionStorage.setItem(LEAD_ID_KEY, res.leadId);
        }
        if (res.userName) {
          sessionStorage.setItem(USER_NAME_KEY, res.userName);
        }
      },
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/login.spec.ts'`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/login/login/login.ts src/app/features/login/login/login.spec.ts
git commit -m "feat: Login persiste user_name en sessionStorage tras validar el token

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Activar `AuthApiHttp` como provider

**Files:**
- Modify: `src/app/app.module.ts:26-27`

**Interfaces:**
- Consumes: `AuthApiHttp` (Task 2).
- Produces: `AUTH_API` resuelve a `AuthApiHttp` en runtime.

**Nota:** `AUTH_API` es compartido; al activar `AuthApiHttp` el flujo OTP (`callback.ts` → `validateOtp`) también pasa a pegarle al backend real (`${API_URI}/Auth/otp/callback`). Es un efecto colateral aceptado; no se modifica ese código.

- [ ] **Step 1: Cambiar el provider**

En `src/app/app.module.ts`, actualizar el import y el provider:

- Cambiar la línea `import { AuthApiMock } from './core/services/auth-api-mock';` por:

```ts
import { AuthApiHttp } from './core/services/auth-api-http';
```

- Reemplazar el comentario + provider (líneas ~26-27):

```ts
    // Para volver al mock: reemplazar AuthApiHttp por AuthApiMock.
    { provide: AUTH_API, useClass: AuthApiHttp }
```

- [ ] **Step 2: Verificar la suite completa**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: PASS (toda la suite, incluidos los specs preexistentes).

- [ ] **Step 3: Verificar build de producción**

Run: `npx ng build --configuration production`
Expected: build exitoso.

- [ ] **Step 4: Commit**

```bash
git add src/app/app.module.ts
git commit -m "feat: activar AuthApiHttp como implementacion de AUTH_API

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Verificación manual (post-implementación)

1. `npx ng serve`
2. Navegar a `http://localhost:4200/mis-negocios/validacion/55F56BA198DDAB19E060220A55073911`
3. Confirmar en la pestaña Network un `GET` a `https://test-servicios.adn.com.mx/sharedmanagement/api/Token/55F56BA198DDAB19E060220A55073911`.
4. Confirmar que el input de email muestra el correo del `system_info`.
5. En consola: `sessionStorage.getItem('sa_leadid')` y `sessionStorage.getItem('sa_user_name')` devuelven los valores esperados.
6. **Si aparece error de CORS:** agregar `proxy.conf.json` para desarrollo o coordinar CORS con backend. No forma parte del alcance de código de este plan.
