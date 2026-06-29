import { Business, BusinessDraft, BusinessStatus } from './business.entity';

/** Snapshot de los campos editables de un negocio (base para crear un draft). */
function snapshot(b: Business): BusinessDraft {
  return {
    businessName: b.businessName, contactName: b.contactName,
    contactEmail: b.contactEmail, contactPhone: b.contactPhone,
    categoryCode: b.categoryCode, category: b.category,
    website: b.website, publicPhone: b.publicPhone,
    products: b.products, logoUrl: b.logoUrl,
    address: b.address, hours: b.hours
  };
}

/** Devuelve el negocio con su draft aplicado (sin mutar el original). */
export function mergeDraft(business: Business): Business {
  return business.draft ? { ...business, ...business.draft } : business;
}

/**
 * Aplica una edición de "guardar avance":
 * - published: la edición va al draft (la versión pública no cambia).
 * - resto: la edición se aplica directo.
 */
export function applyProgressEdit(business: Business, data: Partial<BusinessDraft>): Business {
  if (business.status === 'published') {
    const base = business.draft ?? snapshot(business);
    return { ...business, draft: { ...base, ...data } };
  }
  return { ...business, ...data };
}

/** Estado destino al finalizar, dados los datos válidos y si hay slot disponible. */
export function nextStatusOnFinalize(business: Business, hasSlot: boolean): BusinessStatus {
  if (business.status === 'published') return 'published';
  return hasSlot ? 'published' : 'unpublished';
}

export function canDelete(business: Business): boolean {
  return business.status !== 'published';
}

export function canUnpublish(business: Business): boolean {
  return business.status === 'published';
}
