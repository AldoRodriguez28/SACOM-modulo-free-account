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
