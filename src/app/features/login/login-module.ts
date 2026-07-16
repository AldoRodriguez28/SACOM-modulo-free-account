import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginRoutingModule } from './login-routing-module';
import { Login } from './login/login';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [Login],
  imports: [CommonModule, ReactiveFormsModule, LoginRoutingModule, SharedModule]
})
export class LoginModule { }
