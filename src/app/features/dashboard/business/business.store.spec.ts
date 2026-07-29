import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { BusinessStore } from './business.store';
import { BUSINESS_REPOSITORY } from '../../../data/business/business.repository';
import { BusinessMockRepository } from '../../../data/business/business.mock.repository';

describe('BusinessStore', () => {
  let store: BusinessStore;

  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem('sa_businesses', '[]');
    TestBed.configureTestingModule({
      providers: [
        BusinessStore,
        { provide: BUSINESS_REPOSITORY, useClass: BusinessMockRepository }
      ]
    });
    store = TestBed.inject(BusinessStore);
  });

  async function addBiz(over: Partial<{ businessName: string; category: string; publicPhone: string; fullAddress: string }> = {}) {
    return firstValueFrom(store.addBusiness({
      businessName: over.businessName ?? 'Negocio', contactName: '', contactEmail: '', contactPhone: '',
      categoryCode: 0, category: over.category ?? 'Cat', website: '', publicPhone: over.publicPhone ?? '555', products: '', logoUrl: '',
      address: { fullAddress: over.fullAddress ?? 'Dir', street: '', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 0, lng: 0 },
      hours: { allDay: true, weekdays: null, saturday: null, sunday: null }
    }));
  }

  it('addBusiness agrega un negocio in_progress al signal', async () => {
    await addBiz();
    expect(store.businesses().length).toBe(1);
    expect(store.businesses()[0].status).toBe('in_progress');
  });

  it('finalize con campos completos y slot publica', async () => {
    const b = await addBiz();
    const res = await firstValueFrom(store.finalize(b.id));
    expect(res.success).toBe(true);
    expect(res.status).toBe('published');
    expect(store.getBusinessById(b.id)?.status).toBe('published');
  });

  it('finalize con campos faltantes falla', async () => {
    const b = await addBiz({ businessName: '' });
    const res = await firstValueFrom(store.finalize(b.id));
    expect(res.success).toBe(false);
    expect(res.message).toContain('nombre del negocio');
  });

  it('finalize sin slot deja el negocio unpublished', async () => {
    const a = await addBiz(); await firstValueFrom(store.finalize(a.id));
    const b = await addBiz(); await firstValueFrom(store.finalize(b.id));
    const c = await addBiz(); await firstValueFrom(store.finalize(c.id));
    expect(store.publishedCount()).toBe(3);
    const d = await addBiz();
    const res = await firstValueFrom(store.finalize(d.id));
    expect(res.success).toBe(true);
    expect(res.status).toBe('unpublished');
  });

  it('softDelete rechaza eliminar un publicado', async () => {
    const b = await addBiz();
    await firstValueFrom(store.finalize(b.id));
    const res = await firstValueFrom(store.softDelete(b.id));
    expect(res.success).toBe(false);
  });

  it('publish falla sin slot', async () => {
    for (let i = 0; i < 3; i++) { const x = await addBiz(); await firstValueFrom(store.finalize(x.id)); }
    const u = await addBiz(); await firstValueFrom(store.finalize(u.id)); // queda unpublished
    const res = await firstValueFrom(store.publish(u.id));
    expect(res.success).toBe(false);
  });

  it('publish con slot marca el negocio como published en el signal', async () => {
    const b = await addBiz();
    const res = await firstValueFrom(store.publish(b.id));
    expect(res.success).toBe(true);
    expect(res.status).toBe('published');
    expect(store.getBusinessById(b.id)?.status).toBe('published');
  });

  it('unpublish marca el negocio como unpublished en el signal', async () => {
    const b = await addBiz();
    await firstValueFrom(store.publish(b.id));
    const res = await firstValueFrom(store.unpublish(b.id));
    expect(res.status).toBe('unpublished');
    expect(store.getBusinessById(b.id)?.status).toBe('unpublished');
  });
});
