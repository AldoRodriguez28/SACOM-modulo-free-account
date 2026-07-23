import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';
import {
  heroChartBar,
  heroCog6Tooth
} from '@ng-icons/heroicons/outline';

import { DashboardRoutingModule } from './dashboard-routing-module';
import { Dashboard } from './dashboard/dashboard';
import { Header } from './components/header/header';
import { NavLateral } from './components/nav-lateral/nav-lateral';

@NgModule({
  declarations: [Dashboard, Header, NavLateral],
  imports: [
    CommonModule,
    RouterModule,
    DashboardRoutingModule,
    NgIconsModule.withIcons({ heroChartBar, heroCog6Tooth })
  ]
})
export class DashboardModule { }
