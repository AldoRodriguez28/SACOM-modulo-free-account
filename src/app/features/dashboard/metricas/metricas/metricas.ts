import { Component, OnInit } from '@angular/core';
import { MetricsMockService } from '../../../../core/services/metrics.mock.service';
import { BusinessStore } from '../../business/business.store';
import { AuthMockService } from '../../../../core/services/auth.mock.service';
import { DailyMetric, Metrics } from '../../../../core/models/metrics.model';
import { Business } from '../../../../domain/business/business.entity';

@Component({
  selector: 'app-metricas',
  standalone: false,
  templateUrl: './metricas.html',
  styleUrl: './metricas.scss'
})
export class Metricas implements OnInit {
  businesses: Business[] = [];
  metrics: Metrics | null = null;
  chartData: DailyMetric[] = [];
  totalClicks = 0;
  totalImpressions = 0;

  drawerOpen = false;
  drawerMode: 'detail' | 'edit' | 'add' = 'detail';
  selectedBusiness: Business | null = null;

  get userName(): string { return this.auth.currentUser()?.contactName ?? ''; }

  get publishedCount(): number { return this.businessService.publishedCount(); }

  get ctr(): string {
    if (!this.totalImpressions) return '0%';
    return ((this.totalClicks / this.totalImpressions) * 100).toFixed(1) + '%';
  }

  get clicksTrend(): string { return this.calcTrend('clicks').label; }
  get clicksTrendType(): 'up' | 'down' | 'neutral' { return this.calcTrend('clicks').type; }
  get impressionsTrend(): string { return this.calcTrend('impressions').label; }
  get impressionsTrendType(): 'up' | 'down' | 'neutral' { return this.calcTrend('impressions').type; }

  private calcTrend(field: 'clicks' | 'impressions'): { label: string; type: 'up' | 'down' | 'neutral' } {
    if (!this.chartData.length) return { label: '', type: 'neutral' };
    const half  = Math.floor(this.chartData.length / 2);
    const first  = this.chartData.slice(0, half).reduce((s, d) => s + d[field], 0);
    const second = this.chartData.slice(half).reduce((s, d) => s + d[field], 0);
    if (!first) return { label: '', type: 'neutral' };
    const pct = Math.round(((second - first) / first) * 100);
    if (pct === 0) return { label: '= 0%', type: 'neutral' };
    return { label: `${pct > 0 ? '↑' : '↓'} ${Math.abs(pct)}%`, type: pct > 0 ? 'up' : 'down' };
  }

  constructor(
    private metricsService: MetricsMockService,
    private businessService: BusinessStore,
    private auth: AuthMockService
  ) {}

  ngOnInit(): void { this.loadData(); }

  private loadData(): void {
    this.businesses = this.businessService.businesses();
    const ids = this.businesses.map(b => b.id);
    if (!ids.length) {
      this.metrics = null; this.chartData = [];
      this.totalClicks = 0; this.totalImpressions = 0;
      return;
    }
    this.metricsService.getMetrics(ids).subscribe(m => {
      this.metrics = m;
      this.chartData = m.last30Days;
      this.totalClicks = m.last30Days.reduce((s, d) => s + d.clicks, 0);
      this.totalImpressions = m.last30Days.reduce((s, d) => s + d.impressions, 0);
    });
  }

  openDrawerDetail(biz: Business): void {
    this.selectedBusiness = biz; this.drawerMode = 'detail'; this.drawerOpen = true;
  }

  openDrawerAdd(): void {
    this.selectedBusiness = null; this.drawerMode = 'add'; this.drawerOpen = true;
  }

  closeDrawer(): void { this.drawerOpen = false; }

  onDrawerSaved(_biz: Business): void {
    this.closeDrawer();
    this.loadData();
  }

  onDrawerDeleted(_id: string): void {
    this.closeDrawer();
    this.loadData();
  }

  /** Cuando cambia el status sin cerrar el drawer (unpublish/publish desde detalle) */
  onStatusChanged(biz: Business): void {
    // Actualizar el negocio seleccionado en memoria para reflejar el nuevo status
    this.selectedBusiness = this.businessService.getBusinessById(biz.id) ?? biz;
    this.loadData();
  }
}
