import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: 'crear-contrasena',
    loadChildren: () =>
      import('./features/crear-contrasena/crear-contrasena-module').then(m => m.CrearContrasenaModule)
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./features/login/login-module').then(m => m.LoginModule)
  },
  {
    path: 'validacion',
    loadChildren: () =>
      import('./features/login/login-module').then(m => m.LoginModule)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard-module').then(m => m.DashboardModule)
  },
  {
    path: 'otp',
    loadChildren: () =>
      import('./features/otp/otp-module').then(m => m.OtpModule)
  },
  {
    path: 'no-autorizado',
    loadChildren: () =>
      import('./features/no-autorizado/no-autorizado-module').then(m => m.NoAutorizadoModule)
  },
  {
    path: 'thankyou-page',
    loadChildren: () =>
      import('./features/thankyou-page/thankyou-page-module').then(m => m.ThankyouPageModule)
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    preloadingStrategy: PreloadAllModules,
    scrollPositionRestoration: 'enabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
