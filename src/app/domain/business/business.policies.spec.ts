import { Business } from './business.entity';
import { MAX_PUBLISHED, publishedCount, hasPublishSlot, canPublish } from './business.policies';

function biz(status: Business['status']): Business {
  return {
    id: crypto.randomUUID(), userId: 'u', status,
    businessName: '', contactName: '', contactEmail: '', contactPhone: '',
    categoryCode: 0, category: '', website: '', publicPhone: '', products: '', logoUrl: '',
    address: { fullAddress: '', street: '', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 0, lng: 0 },
    hours: { allDay: true, weekdays: null, saturday: null, sunday: null },
    createdAt: '2026-01-01', draft: null
  };
}

describe('business.policies', () => {
  it('MAX_PUBLISHED es 3', () => {
    expect(MAX_PUBLISHED).toBe(3);
  });

  it('publishedCount cuenta solo los publicados', () => {
    const list = [biz('published'), biz('published'), biz('in_progress'), biz('unpublished')];
    expect(publishedCount(list)).toBe(2);
  });

  it('hasPublishSlot es true con menos de 3 publicados', () => {
    expect(hasPublishSlot([biz('published'), biz('published')])).toBe(true);
  });

  it('hasPublishSlot es false con exactamente 3 publicados', () => {
    expect(hasPublishSlot([biz('published'), biz('published'), biz('published')])).toBe(false);
  });

  it('canPublish refleja hasPublishSlot', () => {
    expect(canPublish([biz('published'), biz('published'), biz('published')])).toBe(false);
    expect(canPublish([])).toBe(true);
  });
});
