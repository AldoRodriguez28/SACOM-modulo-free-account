import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NoAutorizadoRoutingModule } from './no-autorizado-routing-module';
import { NoAutorizado } from './no-autorizado/no-autorizado';


@NgModule({
  declarations: [
    NoAutorizado
  ],
  imports: [
    CommonModule,
    NoAutorizadoRoutingModule
  ]
})
export class NoAutorizadoModule { }
