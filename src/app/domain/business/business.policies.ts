import { Business } from './business.entity';

/** Máximo de negocios publicados simultáneamente (plan free). Fuente única de verdad. */
export const MAX_PUBLISHED = 3;

export function publishedCount(businesses: Business[]): number {
  return businesses.filter(b => b.status === 'published').length;
}

export function hasPublishSlot(businesses: Business[]): boolean {
  return publishedCount(businesses) < MAX_PUBLISHED;
}

/** Alias semántico: ¿se puede publicar uno más? */
export function canPublish(businesses: Business[]): boolean {
  return hasPublishSlot(businesses);
}
