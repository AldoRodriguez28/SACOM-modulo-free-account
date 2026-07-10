import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ThankyouPageRoutingModule } from './thankyou-page-routing-module';
import { ThankyouPage } from './thankyou-page/thankyou-page';


@NgModule({
  declarations: [
    ThankyouPage
  ],
  imports: [
    CommonModule,
    ThankyouPageRoutingModule
  ]
})
export class ThankyouPageModule { }
