import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Observable, of } from 'rxjs';

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
  getOtpUrl(): Observable<OtpUrlResponse> {
    return of<OtpUrlResponse>({ url: 'https://otp.example/start' });
  }
}
