import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthApiHttp } from './auth-api-http';

describe('AuthApiHttp', () => {
  let service: AuthApiHttp;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthApiHttp);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
