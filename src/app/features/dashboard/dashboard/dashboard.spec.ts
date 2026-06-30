import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { Dashboard } from './dashboard';
import { AuthMockService } from '../../../core/services/auth.mock.service';
import { Header } from '../components/header/header';
import { NavLateral } from '../components/nav-lateral/nav-lateral';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Dashboard, Header, NavLateral],
      imports: [RouterTestingModule],
      providers: [AuthMockService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
