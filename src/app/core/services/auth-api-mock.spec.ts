import { TestBed } from '@angular/core/testing';

import { AuthApiMock } from './auth-api-mock';

describe('AuthApiMock', () => {
  let service: AuthApiMock;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthApiMock);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
