import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ThankyouPage } from './thankyou-page';

describe('ThankyouPage', () => {
  let component: ThankyouPage;
  let fixture: ComponentFixture<ThankyouPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ThankyouPage],
      imports: [RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThankyouPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
