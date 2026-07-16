import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast';
import { ToastService } from '../../services/toast';

describe('ToastComponent', () => {
  let fixture: ComponentFixture<ToastComponent>;
  let toast: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ToastComponent],
      providers: [ToastService],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    toast = TestBed.inject(ToastService);
  });

  it('renderiza un toast con su texto y clase de tipo', () => {
    toast.error('Cuenta no registrada', 'Detalle');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const item = el.querySelector('.toast');
    expect(item).toBeTruthy();
    expect(item!.classList).toContain('toast--error');
    expect(el.textContent).toContain('Cuenta no registrada');
    expect(el.textContent).toContain('Detalle');
  });

  it('el botón cerrar remueve el toast', () => {
    toast.error('X');
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.toast__close');
    btn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.toast')).toBeNull();
  });
});
