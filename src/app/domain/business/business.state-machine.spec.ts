import { Business } from './business.entity';
import { mergeDraft, applyProgressEdit, nextStatusOnFinalize, canDelete, canUnpublish } from './business.state-machine';

function biz(over: Partial<Business> = {}): Business {
  return {
    id: 'b1', userId: 'u', status: 'in_progress',
    businessName: 'N', contactName: '', contactEmail: '', contactPhone: '',
    categoryCode: 0, category: 'Cat', website: '', publicPhone: '555', products: '', logoUrl: '',
    address: { fullAddress: 'Dir', street: '', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 0, lng: 0 },
    hours: { allDay: true, weekdays: null, saturday: null, sunday: null },
    createdAt: '2026-01-01', draft: null, ...over
  };
}

describe('business.state-machine', () => {
  describe('mergeDraft', () => {
    it('sin draft devuelve el negocio igual', () => {
      const b = biz();
      expect(mergeDraft(b).businessName).toBe('N');
    });
    it('con draft aplica los campos del draft', () => {
      const b = biz({ status: 'published', draft: { ...biz(), businessName: 'Nuevo' } as any });
      expect(mergeDraft(b).businessName).toBe('Nuevo');
    });
  });

  describe('applyProgressEdit', () => {
    it('para in_progress aplica directo', () => {
      const b = biz({ status: 'in_progress' });
      const out = applyProgressEdit(b, { businessName: 'Editado' });
      expect(out.businessName).toBe('Editado');
      expect(out.draft).toBeNull();
    });
    it('para published guarda en draft sin tocar la versión pública', () => {
      const b = biz({ status: 'published', businessName: 'Publico' });
      const out = applyProgressEdit(b, { businessName: 'Borrador' });
      expect(out.businessName).toBe('Publico');
      expect(out.draft?.businessName).toBe('Borrador');
    });
  });

  describe('nextStatusOnFinalize', () => {
    it('published permanece published', () => {
      expect(nextStatusOnFinalize(biz({ status: 'published' }), true)).toBe('published');
    });
    it('in_progress con slot pasa a published', () => {
      expect(nextStatusOnFinalize(biz({ status: 'in_progress' }), true)).toBe('published');
    });
    it('in_progress sin slot pasa a unpublished', () => {
      expect(nextStatusOnFinalize(biz({ status: 'in_progress' }), false)).toBe('unpublished');
    });
  });

  describe('permisos', () => {
    it('no se puede eliminar un publicado', () => {
      expect(canDelete(biz({ status: 'published' }))).toBe(false);
      expect(canDelete(biz({ status: 'in_progress' }))).toBe(true);
    });
    it('solo se puede despublicar un publicado', () => {
      expect(canUnpublish(biz({ status: 'published' }))).toBe(true);
      expect(canUnpublish(biz({ status: 'unpublished' }))).toBe(false);
    });
  });
});
