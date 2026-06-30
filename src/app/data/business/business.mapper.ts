import { Business } from '../../domain/business/business.entity';

/**
 * Mapeo DTO de API ↔ entidad de dominio.
 * Placeholder: se completará cuando exista el contrato real de la API.
 */
export const businessMapper = {
  toDomain(dto: unknown): Business {
    return dto as Business;
  },
  toDto(business: Business): unknown {
    return business;
  }
};
