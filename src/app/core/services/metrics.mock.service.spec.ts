import { TestBed } from '@angular/core/testing';
import { MetricsMockService } from './metrics.mock.service';

describe('MetricsMockService', () => {
  let service: MetricsMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetricsMockService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('getMetrics() with single id returns 30 data points', (done) => {
    service.getMetrics(['biz-001']).subscribe(m => {
      expect(m.last30Days.length).toBe(30);
      expect(m.businessIds).toEqual(['biz-001']);
      done();
    });
  });

  it('returns zero metrics while the metrics integration is pending', (done) => {
    service.getMetrics(['biz-001']).subscribe(m => {
      m.last30Days.forEach(p => {
        expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(p.clicks).toBe(0);
        expect(p.impressions).toBe(0);
      });
      done();
    });
  });

  it('getMetrics() is deterministic for same ids', (done) => {
    service.getMetrics(['biz-001']).subscribe(first => {
      service.getMetrics(['biz-001']).subscribe(second => {
        expect(first.last30Days[0].clicks).toBe(second.last30Days[0].clicks);
        done();
      });
    });
  });
});
