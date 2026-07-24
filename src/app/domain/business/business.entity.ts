export type BusinessStatus = 'in_progress' | 'published' | 'unpublished';

export interface BusinessHours { open: string; close: string; }

export interface BusinessAddress {
  fullAddress: string; street: string; exteriorNumber: string; colony: string;
  postalCode: string; city: string; state: string; lat: number; lng: number;
}

export interface BusinessHoursSchedule {
  allDay: boolean;
  weekdays: BusinessHours | null;
  saturday: BusinessHours | null;
  sunday: BusinessHours | null;
}

export type BusinessDraft = Omit<Business, 'id' | 'userId' | 'status' | 'draft' | 'createdAt'>;

export interface BusinessFieldItem {
  campo: string;
  requerido: boolean;
  completo: boolean;
  valor: string | null;
  mostrar?: boolean;
}
export interface BusinessFieldsValidation { completo: boolean; campos: BusinessFieldItem[]; }

export interface Business {
  id: string; userId: string; status: BusinessStatus;
  businessName: string; contactName: string; contactEmail: string; contactPhone: string;
  categoryCode: number; category: string; website: string; publicPhone: string;
  products: string; logoUrl: string;
  address: BusinessAddress; hours: BusinessHoursSchedule; createdAt: string;
  draft?: BusinessDraft | null;
  /** Campos devueltos por la API real (GET /businesses y GET /businesses/{id}); ausentes en negocios solo-mock. */
  population?: string;
  publicUrl?: string;
  urlPortal?: string;
  isProfileComplete?: boolean;
  publishedAt?: string | null;
  unpublishedAt?: string | null;
  updatedAt?: string | null;
  fieldsValidation?: BusinessFieldsValidation | null;
}
