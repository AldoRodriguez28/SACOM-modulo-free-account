import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OtpRoutingModule } from './otp-routing-module';
import { Callback } from './callback/callback';


@NgModule({
  declarations: [
    Callback
  ],
  imports: [
    CommonModule,
    OtpRoutingModule
  ]
})
export class OtpModule { }
