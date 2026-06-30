import { TestBed } from '@angular/core/testing';
import { BusinessMockService } from './business.mock.service';
import { Business } from '../models/business.model';

const mockBiz = (): Omit<Business, 'id' | 'userId'> => ({
  businessName: 'Test Biz',
  contactName: 'Test', contactEmail: 'test@test.com', contactPhone: '5551234567',
  categoryCode: 1, category: 'Test', website: '', publicPhone: '5551234567',
  products: 'test', logoUrl: '',
  address: { fullAddress: '', street: '', exteriorNumber: '', colony: '',
    postalCode: '', city: '', state: '', lat: 0, lng: 0 },
  hours: { allDay: true, weekdays: null, saturday: null, sunday: null },
  status: 'in_progress', createdAt: '2026-01-01', draft: null
});

describe('BusinessMockService', () => {
  let service: BusinessMockService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(BusinessMockService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('businesses signal starts with mock-data businesses', () => {
    expect(service.businesses().length).toBeGreaterThanOrEqual(1);
    expect(service.businesses()[0].businessName).toBe('Taquería El Buen Sabor');
  });

  it('addBusiness() adds a new business and updates signal', (done) => {
    const initial = service.businesses().length;
    service.addBusiness(mockBiz()).subscribe(biz => {
      expect(service.businesses().length).toBe(initial + 1);
      expect(biz.id).toBeTruthy();
      expect(biz.userId).toBe('usr-001');
      done();
    });
  });

  it('updateBusiness() updates the correct business by id', (done) => {
    const id = service.businesses()[0].id;
    service.updateBusiness(id, { businessName: 'Nuevo Nombre' }).subscribe(biz => {
      expect(biz.businessName).toBe('Nuevo Nombre');
      expect(service.businesses()[0].businessName).toBe('Nuevo Nombre');
      done();
    });
  });

  it('deleteBusiness() removes the business from the signal', (done) => {
    const id = service.businesses()[0].id;
    const initial = service.businesses().length;
    service.deleteBusiness(id).subscribe(() => {
      expect(service.businesses().length).toBe(initial - 1);
      expect(service.businesses().find(b => b.id === id)).toBeUndefined();
      done();
    });
  });

  it('uploadLogo() converts File to base64', (done) => {
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    service.uploadLogo(file).subscribe(result => {
      expect(result).toContain('data:image/png;base64,');
      done();
    });
  });

  it('getBusinessById() returns the business when found and undefined otherwise', () => {
    const existing = service.businesses()[0];
    expect(service.getBusinessById(existing.id)).toEqual(existing);
    expect(service.getBusinessById('does-not-exist')).toBeUndefined();
  });

  it('addBusiness() persists the new list to sessionStorage', (done) => {
    const initial = service.businesses().length;
    service.addBusiness({
      businessName: 'Persisted Biz',
      contactName: 'T', contactEmail: 't@t.com', contactPhone: '5551234567',
      categoryCode: 1, category: 'Test', website: '', publicPhone: '5551234567',
      products: 'test', logoUrl: '',
      address: { fullAddress: '', street: '', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 0, lng: 0 },
      hours: { allDay: true, weekdays: null, saturday: null, sunday: null }
    }).subscribe(() => {
      const stored = JSON.parse(sessionStorage.getItem('sa_businesses')!);
      expect(stored.length).toBe(initial + 1);
      done();
    });
  });
});
