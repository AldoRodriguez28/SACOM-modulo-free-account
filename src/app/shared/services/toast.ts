import { Injectable, Signal, signal } from '@angular/core';

export type ToastType = 'error' | 'success' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  text: string;
  detail?: string;
  duration: number;
}

export const DEFAULT_TOAST_DURATION = 5000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts: Signal<Toast[]> = this._toasts.asReadonly();

  private nextId = 1;

  error(text: string, detail?: string): number {
    return this.show('error', text, detail);
  }

  success(text: string, detail?: string): number {
    return this.show('success', text, detail);
  }

  info(text: string, detail?: string): number {
    return this.show('info', text, detail);
  }

  dismiss(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private show(type: ToastType, text: string, detail?: string): number {
    const id = this.nextId++;
    const toast: Toast = { id, type, text, detail, duration: DEFAULT_TOAST_DURATION };
    this._toasts.update(list => [...list, toast]);
    if (toast.duration > 0) {
      setTimeout(() => this.dismiss(id), toast.duration);
    }
    return id;
  }
}
