import { Business } from './business.entity';
import { requiredFieldsForPublish } from './business.validation';

type Data = Pick<Business, 'businessName' | 'category' | 'address' | 'publicPhone'>;

function data(overrides: Partial<Data> = {}): Data {
  return {
    businessName: 'Mi Negocio', category: 'Restaurantes', publicPhone: '5512345678',
    address: { fullAddress: 'Calle 1', street: '', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 0, lng: 0 },
    ...overrides
  };
}

describe('requiredFieldsForPublish', () => {
  it('no devuelve faltantes cuando todo está completo', () => {
    expect(requiredFieldsForPublish(data())).toEqual([]);
  });

  it('detecta nombre faltante', () => {
    expect(requiredFieldsForPublish(data({ businessName: '   ' }))).toContain('nombre del negocio');
  });

  it('detecta categoría faltante', () => {
    expect(requiredFieldsForPublish(data({ category: '' }))).toContain('categoría o giro');
  });

  it('detecta teléfono faltante', () => {
    expect(requiredFieldsForPublish(data({ publicPhone: '' }))).toContain('teléfono');
  });

  it('acepta dirección por street si no hay fullAddress', () => {
    const d = data({ address: { fullAddress: '', street: 'Av. Siempre Viva', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 0, lng: 0 } });
    expect(requiredFieldsForPublish(d)).not.toContain('dirección');
  });

  it('detecta dirección faltante cuando no hay fullAddress ni street', () => {
    const d = data({ address: { fullAddress: '', street: '', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 0, lng: 0 } });
    expect(requiredFieldsForPublish(d)).toContain('dirección');
  });
});
