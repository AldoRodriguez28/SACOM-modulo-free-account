import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BUSINESS_REPOSITORY } from './data/business/business.repository';
import { BusinessMockRepository } from './data/business/business.mock.repository';
import { AUTH_API } from './core/services/auth-api';
import { AuthApiMock } from './core/services/auth-api-mock';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    { provide: BUSINESS_REPOSITORY, useClass: BusinessMockRepository },
    // Mientras la API real no esté disponible se usa el mock.
    // Para conectar el backend real: reemplazar AuthApiMock por AuthApiHttp.
    { provide: AUTH_API, useClass: AuthApiMock }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
