import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { Metricas } from './metricas';
import { MetricsMockService } from '../../../../core/services/metrics.mock.service';
import { AuthMockService } from '../../../../core/services/auth.mock.service';
import { BUSINESS_REPOSITORY } from '../../../../data/business/business.repository';
import { Business } from '../../../../domain/business/business.entity';

const STUB_BIZ: Business = {
  id: 'b1', userId: 'u1', status: 'published',
  businessName: 'Test', contactName: 'User', contactEmail: 'u@t.com', contactPhone: '0000000000',
  categoryCode: 1, category: 'Test', website: '', publicPhone: '0000000000', products: '',
  logoUrl: '', createdAt: new Date().toISOString(), draft: null,
  address: { fullAddress: '', street: '', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 19, lng: -99 },
  hours: { allDay: true, weekdays: null, saturday: null, sunday: null }
};

const mockRepo = {
  getAll: () => of([STUB_BIZ]),
  getById: (_id: string) => of(STUB_BIZ),
  create: (_: any) => of({} as any),
  update: (_id: string, data: any) => of(data as any),
  remove: (_: string) => of(undefined as void),
  uploadLogo: (_: File) => of('')
};

describe('Metricas', () => {
  let component: Metricas;
  let fixture: ComponentFixture<Metricas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Metricas],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        MetricsMockService,
        AuthMockService,
        { provide: BUSINESS_REPOSITORY, useValue: mockRepo }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Metricas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load metrics data on init', () => {
    expect(component.chartData.length).toBe(30);
    expect(component.totalClicks).toBeGreaterThan(0);
    expect(component.totalImpressions).toBeGreaterThan(0);
  });

  it('should open drawer in detail mode when a business is selected', () => {
    const biz = component.businesses[0];
    component.openDrawerDetail(biz);
    expect(component.drawerOpen).toBeTrue();
    expect(component.drawerMode).toBe('detail');
    expect(component.selectedBusiness).toBe(biz);
  });

  it('should open drawer in add mode when add is requested', () => {
    component.openDrawerAdd();
    expect(component.drawerOpen).toBeTrue();
    expect(component.drawerMode).toBe('add');
    expect(component.selectedBusiness).toBeNull();
  });

  it('should close drawer on closeDrawer()', () => {
    component.drawerOpen = true;
    component.closeDrawer();
    expect(component.drawerOpen).toBeFalse();
  });

  it('onDrawerSaved closes the drawer and reloads data', () => {
    component.drawerOpen = true;
    const loadSpy = spyOn(component as any, 'loadData').and.callThrough();
    component.onDrawerSaved({} as any);
    expect(component.drawerOpen).toBeFalse();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('onBcmBusinessRegistered refreshes businesses without closing the drawer', () => {
    component.drawerOpen = true;
    const reloadSpy = spyOn((component as any).businessService, 'reload').and.callThrough();
    component.onBcmBusinessRegistered({} as any);
    expect(component.drawerOpen).toBeTrue();
    expect(reloadSpy).toHaveBeenCalled();
  });

  it('onDrawerDeleted closes the drawer and reloads data', () => {
    component.drawerOpen = true;
    const loadSpy = spyOn(component as any, 'loadData').and.callThrough();
    component.onDrawerDeleted('some-id');
    expect(component.drawerOpen).toBeFalse();
    expect(loadSpy).toHaveBeenCalled();
  });
});
