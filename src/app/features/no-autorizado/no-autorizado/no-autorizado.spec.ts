import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { NoAutorizado } from './no-autorizado';

describe('NoAutorizado', () => {
  let component: NoAutorizado;
  let fixture: ComponentFixture<NoAutorizado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NoAutorizado],
      imports: [RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoAutorizado);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
