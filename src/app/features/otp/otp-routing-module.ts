import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Callback } from './callback/callback';

const routes: Routes = [
  { path: 'callback', component: Callback }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OtpRoutingModule { }
