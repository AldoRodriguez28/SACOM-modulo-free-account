import { Component, inject } from '@angular/core';
import { Toast, ToastService } from '../../services/toast';

@Component({
  selector: 'app-toast',
  standalone: false,
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class ToastComponent {
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;

  close(id: number): void {
    this.toastService.dismiss(id);
  }

  trackById(_index: number, item: Toast): number {
    return item.id;
  }
}
