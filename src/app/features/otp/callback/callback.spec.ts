import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { Callback } from './callback';
import { AuthMockService } from '../../../core/services/auth.mock.service';
import { AUTH_API } from '../../../core/services/auth-api';
import { AuthApiMock } from '../../../core/services/auth-api-mock';

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
