import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BUSINESS_REPOSITORY } from './data/business/business.repository';
import { BusinessMockRepository } from './data/business/business.mock.repository';

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
    { provide: BUSINESS_REPOSITORY, useClass: BusinessMockRepository }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
