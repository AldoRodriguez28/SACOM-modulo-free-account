import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PasswordStrengthComponent } from './components/password-strength/password-strength.component';
import { ToastComponent } from './components/toast/toast';

@NgModule({
  declarations: [PasswordStrengthComponent, ToastComponent],
  imports: [CommonModule],
  exports: [PasswordStrengthComponent, CommonModule, ToastComponent],
})
export class SharedModule {}
