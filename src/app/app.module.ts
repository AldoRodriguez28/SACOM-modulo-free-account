import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BUSINESS_REPOSITORY } from './data/business/business.repository';
import { BusinessHttpRepository } from './data/business/business.http.repository';
import { AUTH_API } from './core/services/auth-api';
import { AuthApiHttp } from './core/services/auth-api-http';
import { SharedModule } from './shared/shared.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    SharedModule
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    { provide: BUSINESS_REPOSITORY, useClass: BusinessHttpRepository },
    // Para volver al mock: reemplazar AuthApiHttp por AuthApiMock.
    { provide: AUTH_API, useClass: AuthApiHttp }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
