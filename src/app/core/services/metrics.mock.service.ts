import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DailyMetric, Metrics } from '../models/metrics.model';

@Injectable({ providedIn: 'root' })
export class MetricsMockService {

  getMetrics(businessIds: string[]): Observable<Metrics> {
    const perBusiness = businessIds.map(() => this.generateEmptyMetrics());
    return of({ businessIds, last30Days: this.aggregate(perBusiness) });
  }

  private generateEmptyMetrics(): DailyMetric[] {
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (29 - i));
      return {
        date: d.toISOString().split('T')[0],
        clicks: 0,
        impressions: 0
      };
    });
  }

  private aggregate(perBusiness: DailyMetric[][]): DailyMetric[] {
    if (!perBusiness.length) return [];
    return perBusiness[0].map((day, i) => ({
      date: day.date,
      clicks: perBusiness.reduce((sum, biz) => sum + biz[i].clicks, 0),
      impressions: perBusiness.reduce((sum, biz) => sum + biz[i].impressions, 0)
    }));
  }
}
