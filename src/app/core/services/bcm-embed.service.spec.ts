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