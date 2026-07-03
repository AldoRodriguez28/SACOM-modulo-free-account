import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { Login } from './login';
import { AuthMockService } from '../../../core/services/auth.mock.service';
import { AUTH_API } from '../../../core/services/auth-api';
import { AuthApiMock } from '../../../core/services/auth-api-mock';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Login],
      imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [
        AuthMockService,
        { provide: AUTH_API, useClass: AuthApiMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
