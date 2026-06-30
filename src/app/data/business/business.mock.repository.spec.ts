import { BusinessMockRepository } from './business.mock.repository';
import { firstValueFrom } from 'rxjs';

describe('BusinessMockRepository', () => {
  let repo: BusinessMockRepository;

  beforeEach(() => {
    sessionStorage.clear();
    repo = new BusinessMockRepository();
  });

  it('getAll devuelve la semilla cuando no hay datos guardados', async () => {
    const list = await firstValueFrom(repo.getAll());
    expect(Array.isArray(list)).toBe(true);
  });

  it('create asigna id, status in_progress y createdAt', async () => {
    const created = await firstValueFrom(repo.create({
      businessName: 'Test', contactName: '', contactEmail: '', contactPhone: '',
      categoryCode: 0, category: '', website: '', publicPhone: '', products: '', logoUrl: '',
      address: { fullAddress: '', street: '', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 0, lng: 0 },
      hours: { allDay: true, weekdays: null, saturday: null, sunday: null }
    }));
    expect(created.id).toBeTruthy();
    expect(created.status).toBe('in_progress');
    expect(created.createdAt).toBeTruthy();
  });

  it('update persiste cambios y los devuelve', async () => {
    const created = await firstValueFrom(repo.create({
      businessName: 'A', contactName: '', contactEmail: '', contactPhone: '',
      categoryCode: 0, category: '', website: '', publicPhone: '', products: '', logoUrl: '',
      address: { fullAddress: '', street: '', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 0, lng: 0 },
      hours: { allDay: true, weekdays: null, saturday: null, sunday: null }
    }));
    const updated = await firstValueFrom(repo.update(created.id, { businessName: 'B' }));
    expect(updated.businessName).toBe('B');
    const all = await firstValueFrom(repo.getAll());
    expect(all.find(b => b.id === created.id)?.businessName).toBe('B');
  });

  it('remove elimina por id', async () => {
    const created = await firstValueFrom(repo.create({
      businessName: 'A', contactName: '', contactEmail: '', contactPhone: '',
      categoryCode: 0, category: '', website: '', publicPhone: '', products: '', logoUrl: '',
      address: { fullAddress: '', street: '', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 0, lng: 0 },
      hours: { allDay: true, weekdays: null, saturday: null, sunday: null }
    }));
    await firstValueFrom(repo.remove(created.id));
    const all = await firstValueFrom(repo.getAll());
    expect(all.find(b => b.id === created.id)).toBeUndefined();
  });
});
