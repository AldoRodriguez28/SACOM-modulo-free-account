import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '../../../environments/environment';
import { BcmEmbedService } from './bcm-embed.service';

describe('BcmEmbedService', () => {
  let service: BcmEmbedService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(BcmEmbedService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('generateEditToken incluye PortalBusinessId en la ruta', () => {
    const portalBusinessId = '9db53819-e640-4f14-97e8-e3609a32ac48';

    service.generateEditToken(portalBusinessId).subscribe();

    const req = httpMock.expectOne(
      `${environment.API_URI}/businesses/${portalBusinessId}/bcm/token/edit`
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});

    req.flush({
      token: 'token',
      embedUrl: 'https://bcm-test.seccionamarilla.com/token',
      expirationDateUtc: '2026-09-03T23:59:59Z'
    });
  });

  it('registerBcmEvent hace POST a /bcm/events', () => {
    let completed = false;

    service.registerBcmEvent({
      eventType: 'bcm:error',
      severity: 'ERROR',
      message: 'BCM reporto un error',
      errorCode: 'BCM-500',
      bcmBusinessId: 15,
      bcmBusinessVersionNumber: 3,
      rawPayload: '{"type":"bcm:error"}'
    }).subscribe(() => { completed = true; });

    const req = httpMock.expectOne(
      r => r.method === 'POST' && r.url === `${environment.API_URI}/bcm/events`
    );
    expect(req.request.body.eventType).toBe('bcm:error');
    expect(req.request.body.severity).toBe('ERROR');

    req.flush({});

    expect(completed).toBeTrue();
  });
});
