import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Observable, of } from 'rxjs';
import { throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../../shared/services/toast';

import { Login, USER_NAME_KEY, LEAD_ID_KEY } from './login';
import { AuthMockService } from '../../../core/services/auth.mock.service';
import { AUTH_API, AuthApi } from '../../../core/services/auth-api';
import { AuthResponse, OtpUrlResponse } from '../../../core/models/auth-response.model';

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

/** Stub de AuthApi que devuelve una respuesta con userName. */
class AuthApiMockStub implements AuthApi {
  loginByToken(): Observable<AuthResponse> {
    return of<AuthResponse>({
      token: 'sess',
      leadId: '566171',
      systemInfo: { email: 'aldo@gmail.com' },
      userName: 'ALDO RODRIGUEZ',
      origen: 'SACOM-PORTAL',
    });
  }
  validateOtp(): Observable<AuthResponse> {
    return of<AuthResponse>({ token: 'sess' });
  }
  getOtpUrl(): Observable<OtpUrlResponse> {
    return of<OtpUrlResponse>({ url: 'https://otp.example/start' });
  }
}
