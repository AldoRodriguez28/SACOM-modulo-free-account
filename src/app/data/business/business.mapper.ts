import { Business, BusinessFieldsValidation, BusinessStatus } from '../../domain/business/business.entity';

export interface BusinessesResponseDto {
  businesses: BusinessSummaryDto[];
  total: number;
  published: number;
}

export interface BusinessSummaryDto {
  portalBusinessId: string;
  businessName: string | null;
  categoryName: string | null;
  population: string | null;
  status: string;
}

export interface BusinessFieldItemDto {
  campo: string;
  requerido: boolean;
  completo: boolean;
  valor: string | null;
  mostrar?: boolean;
}

export interface BusinessFieldsValidationDto {
  completo: boolean;
  campos: BusinessFieldItemDto[];
}

export interface BusinessDetailDto {
  portalBusinessId: string;
  businessName: string | null;
  categoryName: string | null;
  population: string | null;
  publicUrl: string | null;
  status: string;
  isProfileComplete: boolean;
  publishedAt: string | null;
  unpublishedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  fieldsValidation: BusinessFieldsValidationDto | null;
  urlPortal: string | null;
}

export interface PublishResponseDto {
  portalBusinessId: string;
  publicado: boolean;
  adnAccountId: number;
  adnProductId: number;
}

export interface UnpublishResponseDto {
  portalBusinessId: string;
  despublicado: boolean;
}

const emptyAddress = {
  fullAddress: '', street: '', exteriorNumber: '', colony: '',
  postalCode: '', city: '', state: '', lat: 0, lng: 0
};

const emptyHours = { allDay: true, weekdays: null, saturday: null, sunday: null };

export const businessMapper = {
  toDomain(dto: BusinessSummaryDto): Business {
    return {
      id: dto.portalBusinessId,
      userId: '',
      status: mapBusinessStatus(dto.status),
      businessName: dto.businessName ?? '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      categoryCode: 0,
      category: dto.categoryName ?? '',
      population: dto.population ?? '',
      website: '',
      publicPhone: '',
      products: '',
      logoUrl: '',
      address: { ...emptyAddress },
      hours: { ...emptyHours },
      createdAt: '',
      draft: null
    };
  },

  detailToDomain(dto: BusinessDetailDto): Business {
    return {
      id: dto.portalBusinessId,
      userId: '',
      status: mapBusinessStatus(dto.status),
      businessName: dto.businessName ?? '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      categoryCode: 0,
      category: dto.categoryName ?? '',
      population: dto.population ?? '',
      website: '',
      publicPhone: '',
      products: '',
      logoUrl: '',
      address: { ...emptyAddress },
      hours: { ...emptyHours },
      createdAt: dto.createdAt ?? '',
      draft: null,
      publicUrl: dto.publicUrl ?? '',
      isProfileComplete: dto.isProfileComplete,
      publishedAt: dto.publishedAt,
      unpublishedAt: dto.unpublishedAt,
      updatedAt: dto.updatedAt,
      fieldsValidation: mapFieldsValidation(dto.fieldsValidation),
      urlPortal: dto.urlPortal ?? ''
    };
  },

  toDto(business: Business): unknown {
    return business;
  }
};

function mapFieldsValidation(dto: BusinessFieldsValidationDto | null): BusinessFieldsValidation | null {
  if (!dto) return null;
  return {
    completo: dto.completo,
    campos: (dto.campos ?? []).map(c => ({
      campo: c.campo,
      requerido: c.requerido,
      completo: c.completo,
      valor: c.valor,
      mostrar: c.mostrar ?? true
    }))
  };
}

function mapBusinessStatus(status: string): BusinessStatus {
  const normalized = normalizeStatus(status);
  if (normalized === 'publicado' || normalized === 'published') return 'published';
  if (normalized === 'no publicado' || normalized === 'unpublished') return 'unpublished';
  return 'in_progress';
}

function normalizeStatus(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
