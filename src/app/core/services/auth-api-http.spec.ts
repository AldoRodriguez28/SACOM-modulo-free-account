import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '../../../environments/environment';
import { AuthApiHttp } from './auth-api-http';
import { AuthResponse, OtpUrlResponse } from '../models/auth-response.model';

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

  it('loginByToken hace GET a /Auth/handshake y mapea system_info, user_name y origen', () => {
    const token = '560E194422578FDFE060220A55077DCD';
    let result: AuthResponse | undefined;

    service.loginByToken(token).subscribe(r => (result = r));

    const req = httpMock.expectOne(
      r => r.method === 'GET' && r.url === `${environment.API_URI}/Auth/handshake`
    );
    expect(req.request.params.get('token')).toBe(token);
    expect(req.request.headers.get('accept')).toBe('*/*');
    req.flush({
      token,
      source: 'SACOM-NEGOCIOS',
      system_info: { email: 'aldo@gmail.com', LeadId: 566172 },
      user_name: 'aldo  ',
      role: 'CLIENTE-NEGOCIOS',
      status: 1,
      origin_system: 'SACOM-PORTAL',
    });

    expect(result!.token).toBe(token);
    expect(result!.systemInfo!.email).toBe('aldo@gmail.com');
    expect(result!.leadId).toBe('566172');
    expect(result!.userName).toBe('aldo');
    expect(result!.origen).toBe('SACOM-PORTAL');
  });

  it('getOtpUrl hace GET a /Auth/otp/url con los 4 params y el header accept', () => {
    let result: OtpUrlResponse | undefined;

    service
      .getOtpUrl({
        email: 'a@b.com',
        leadId: '123456',
        origen: 'RegistraTuEmpresa',
        redirectUri: 'http://localhost:4200/mis-negocios/otp/callback',
      })
      .subscribe(r => (result = r));

    const req = httpMock.expectOne(
      r => r.method === 'GET' && r.url === `${environment.API_URI}/Auth/otp/url`
    );
    expect(req.request.params.get('email')).toBe('a@b.com');
    expect(req.request.params.get('leadId')).toBe('123456');
    expect(req.request.params.get('origen')).toBe('RegistraTuEmpresa');
    expect(req.request.params.get('redirectUri')).toBe(
      'http://localhost:4200/mis-negocios/otp/callback'
    );
    expect(req.request.headers.get('accept')).toBe('*/*');

    req.flush({ url: 'https://test-otp.seccionamarilla.com.mx/otp/start?x=1' });

    expect(result!.url).toBe('https://test-otp.seccionamarilla.com.mx/otp/start?x=1');
  });

  it('validateOtp hace GET a /Auth/otp/callback con code y state y el header accept', () => {
    let result: AuthResponse | undefined;

    service.validateOtp('561D2FFA07CE18F2E060220A55073111', 'KcLOhjqJFuyEHA-MyaAbYQ')
      .subscribe(r => (result = r));

    const req = httpMock.expectOne(
      r => r.method === 'GET' && r.url === `${environment.API_URI}/Auth/otp/callback`
    );
    expect(req.request.params.get('code')).toBe('561D2FFA07CE18F2E060220A55073111');
    expect(req.request.params.get('state')).toBe('KcLOhjqJFuyEHA-MyaAbYQ');
    expect(req.request.headers.get('accept')).toBe('*/*');

    req.flush({ token: 'sess-token' });

    expect(result!.token).toBe('sess-token');
  });

  it('loginByToken tolera system_info ausente', () => {
    const token = 'sin-info';
    let result: AuthResponse | undefined;

    service.loginByToken(token).subscribe(r => (result = r));

    httpMock
      .expectOne(r => r.method === 'GET' && r.url === `${environment.API_URI}/Auth/handshake`)
      .flush({ token, user_name: '' });

    expect(result!.token).toBe(token);
    expect(result!.systemInfo).toBeUndefined();
    expect(result!.leadId).toBeUndefined();
    expect(result!.userName).toBeUndefined();
  });
});
