import { Business } from './business.entity';

type PublishableFields = Pick<Business, 'businessName' | 'category' | 'address' | 'publicPhone'>;

/** Devuelve las etiquetas de los campos mínimos faltantes para publicar. Vacío = válido. */
export function requiredFieldsForPublish(data: PublishableFields): string[] {
  const missing: string[] = [];
  if (!data.businessName?.trim()) missing.push('nombre del negocio');
  if (!data.category?.trim()) missing.push('categoría o giro');
  if (!data.address?.fullAddress?.trim() && !data.address?.street?.trim()) missing.push('dirección');
  if (!data.publicPhone?.trim()) missing.push('teléfono');
  return missing;
}
