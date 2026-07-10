import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Observable, of } from 'rxjs';

import { Callback } from './callback';
import { AuthMockService } from '../../../core/services/auth.mock.service';
import { AUTH_API, AuthApi } from '../../../core/services/auth-api';
import { AuthApiMock } from '../../../core/services/auth-api-mock';
import { AuthResponse, OtpUrlResponse } from '../../../core/models/auth-response.model';

describe('Callback', () => {
  let component: Callback;
  let fixture: ComponentFixture<Callback>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Callback],
      imports: [RouterTestingModule],
      providers: [
        AuthMockService,
        { provide: AUTH_API, useClass: AuthApiMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Callback);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

/** Stub de AuthApi cuyo validateOtp devuelve el `origen` que se le indique. */
class AuthApiOrigenStub implements AuthApi {
  constructor(private origen?: string) {}
  loginByToken(): Observable<AuthResponse> {
    return of<AuthResponse>({ token: 'sess' });
  }
  validateOtp(): Observable<AuthResponse> {
    return of<AuthResponse>({ token: 'sess', origen: this.origen });
  }
  getOtpUrl(): Observable<OtpUrlResponse> {
    return of<OtpUrlResponse>({ url: 'https://otp.example/start' });
  }
}

describe('Callback redirige según el origen', () => {
  function crear(origen?: string): Router {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [Callback],
      providers: [
        AuthMockService,
        { provide: Router, useValue: router },
        { provide: AUTH_API, useValue: new AuthApiOrigenStub(origen) },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({ code: 'ok', state: 'st' }) },
          },
        },
      ],
    });

    TestBed.createComponent(Callback).detectChanges();
    return router;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('navega a /thankyou-page cuando el origen es RegistraTuEmpresa', () => {
    const router = crear('RegistraTuEmpresa');
    expect(router.navigate).toHaveBeenCalledWith(['/thankyou-page']);
  });

  it('navega al dashboard cuando el origen es otro', () => {
    const router = crear('CuentaGratuita');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/metricas']);
  });
});
