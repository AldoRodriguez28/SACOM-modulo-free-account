import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NoAutorizado } from './no-autorizado/no-autorizado';

const routes: Routes = [
  { path: '', component: NoAutorizado }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NoAutorizadoRoutingModule { }
