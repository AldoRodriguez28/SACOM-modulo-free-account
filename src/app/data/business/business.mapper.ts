import { Business, BusinessStatus } from '../../domain/business/business.entity';

export interface BusinessesResponseDto {
  businesses: BusinessSummaryDto[];
  total: number;
  published: number;
}

export interface BusinessSummaryDto {
  portalBusinessId: string;
  businessName: string;
  status: string;
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
      category: '',
      website: '',
      publicPhone: '',
      products: '',
      logoUrl: '',
      address: {
        fullAddress: '',
        street: '',
        exteriorNumber: '',
        colony: '',
        postalCode: '',
        city: '',
        state: '',
        lat: 0,
        lng: 0
      },
      hours: {
        allDay: true,
        weekdays: null,
        saturday: null,
        sunday: null
      },
      createdAt: '',
      draft: null
    };
  },

  toDto(business: Business): unknown {
    return business;
  }
};

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
