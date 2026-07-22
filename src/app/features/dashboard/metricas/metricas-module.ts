import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { GoogleMapsModule } from '@angular/google-maps';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { NgIconsModule } from '@ng-icons/core';
import {
  heroBuildingStorefront,
  heroXMark,
  heroPencilSquare,
  heroTrash,
  heroArrowLeft,
  heroArrowRight,
  heroArrowUpTray,
  heroArrowDownTray,
  heroCheckCircle,
  heroChevronRight,
  heroPlus,
  heroMapPin,
  heroCursorArrowRays,
  heroEye,
  heroEyeSlash,
  heroArrowTrendingUp,
  heroBriefcase,
  heroExclamationTriangle
} from '@ng-icons/heroicons/outline';
import { Metricas } from './metricas/metricas';
import { LineChart } from './line-chart/line-chart';
import { KpiCard } from './kpi-card/kpi-card';
import { BusinessListCard } from './business-list-card/business-list-card';
import { BusinessDrawer } from '../components/business-drawer/business-drawer';

const routes: Routes = [{ path: '', component: Metricas }];

@NgModule({
  declarations: [Metricas, LineChart, KpiCard, BusinessListCard, BusinessDrawer],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    GoogleMapsModule,
    BaseChartDirective,
    NgIconsModule.withIcons({
      heroBuildingStorefront, heroXMark, heroPencilSquare, heroTrash,
      heroArrowLeft, heroArrowRight, heroArrowUpTray, heroArrowDownTray,
      heroCheckCircle, heroChevronRight, heroPlus, heroMapPin,
      heroCursorArrowRays, heroEye, heroEyeSlash,
      heroArrowTrendingUp, heroBriefcase, heroExclamationTriangle
    })
  ],
  providers: [provideCharts(withDefaultRegisterables())]
})
export class MetricasModule {}
