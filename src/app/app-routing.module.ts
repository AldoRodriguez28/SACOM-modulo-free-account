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
