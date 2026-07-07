import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BUSINESS_REPOSITORY } from './data/business/business.repository';
import { BusinessMockRepository } from './data/business/business.mock.repository';
import { AUTH_API } from './core/services/auth-api';
import { AuthApiHttp } from './core/services/auth-api-http';

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
    // Para volver al mock: reemplazar AuthApiHttp por AuthApiMock.
    { provide: AUTH_API, useClass: AuthApiHttp }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
