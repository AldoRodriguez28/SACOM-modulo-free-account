import { fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    service = new ToastService();
  });

  it('error() agrega un toast de tipo error con text y detail', () => {
    service.error('Cuenta no registrada', 'No existe una cuenta con ese correo.');
    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('error');
    expect(toasts[0].text).toBe('Cuenta no registrada');
    expect(toasts[0].detail).toBe('No existe una cuenta con ese correo.');
  });

  it('success() e info() agregan toasts con su tipo', () => {
    service.success('Listo');
    service.info('Dato');
    const types = service.toasts().map(t => t.type);
    expect(types).toEqual(['success', 'info']);
  });

  it('dismiss() remueve el toast por id', () => {
    const id = service.error('X');
    expect(service.toasts().length).toBe(1);
    service.dismiss(id);
    expect(service.toasts().length).toBe(0);
  });

  it('auto-cierra el toast tras la duración por defecto', fakeAsync(() => {
    service.error('X');
    expect(service.toasts().length).toBe(1);
    tick(5000);
    expect(service.toasts().length).toBe(0);
  }));
});
