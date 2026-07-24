import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { of } from 'rxjs';
import { BUSINESS_REPOSITORY } from '../../../../data/business/business.repository';
import { BusinessDrawer } from './business-drawer';

const mockRepo = {
  getAll: () => of([]),
  getById: (id: string) => of({
    id,
    address: { fullAddress: '', street: '', exteriorNumber: '', colony: '', postalCode: '', city: '', state: '', lat: 0, lng: 0 },
    hours: { allDay: true, weekdays: null, saturday: null, sunday: null },
    logoUrl: ''
  } as any),
  create: (_: any) => of({} as any),
  update: (_id: string, data: any) => of(data as any),
  remove: (_: string) => of(undefined as void),
  uploadLogo: (_: File) => of('')
};

describe('BusinessDrawer', () => {
  let component: BusinessDrawer;
  let fixture: ComponentFixture<BusinessDrawer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BusinessDrawer],
      imports: [ReactiveFormsModule, GoogleMapsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: BUSINESS_REPOSITORY, useValue: mockRepo }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessDrawer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  const fixtureBiz = () => ({
    id: 'b1', userId: 'u1', businessName: 'Tacos', contactName: 'Juan',
    contactEmail: 'j@t.com', contactPhone: '5551234567', categoryCode: 1,
    category: 'Rest', website: '', publicPhone: '5559876543', products: 'tacos', logoUrl: '',
    address: { fullAddress: 'X', street: 'S', exteriorNumber: '1', colony: 'C', postalCode: '06700', city: 'CDMX', state: 'CDMX', lat: 19.4, lng: -99.1 },
    hours: { allDay: false, weekdays: { open: '08:00', close: '22:00' }, saturday: null, sunday: null }
  } as any);

  it('ngOnChanges in edit mode populates the form from the business', () => {
    component.mode = 'edit';
    component.business = fixtureBiz();
    component.ngOnChanges();
    expect(component.form.value.businessName).toBe('Tacos');
    expect(component.form.value.contactEmail).toBe('j@t.com');
  });

  it('Continuar edición solicita el token BCM con el PortalBusinessId', () => {
    const business = fixtureBiz();
    const bcmService = (component as any).bcmEmbedService;
    const generateEditToken = spyOn(bcmService, 'generateEditToken').and.returnValue(of({
      token: 'token-edit',
      embedUrl: 'https://bcm-test.seccionamarilla.com/edicion-negocio/token-edit',
      expirationDateUtc: '2026-09-03T23:59:59Z'
    }));
    component.mode = 'detail';
    component.business = business;
    component.ngOnChanges();

    component.switchToEdit();

    expect(generateEditToken).toHaveBeenCalledOnceWith(business.id);
    expect(component.internalMode).toBe('edit');
  });

  it('registra en logs los eventos BCM de edición', () => {
    const bcmService = (component as any).bcmEmbedService;
    const registerBcmEvent = spyOn(bcmService, 'registerBcmEvent').and.returnValue(of(void 0));
    const commonPayload = {
      businessId: 12600329,
      versionNumber: 1,
      commercialName: 'Tortilería Doña Luz Puebla',
      timestamp: '2026-07-22T00:28:29.524Z',
      targetOrigin: 'https://www.seccionamarillaus.com/mis-negocios'
    };

    window.dispatchEvent(new MessageEvent('message', {
      origin: 'https://bcm-test.seccionamarilla.com',
      data: { type: 'bcm:business-updated', ...commonPayload }
    }));
    window.dispatchEvent(new MessageEvent('message', {
      origin: 'https://bcm-test.seccionamarilla.com',
      data: {
        type: 'bcm:business-error',
        ...commonPayload,
        errorMessage: 'No se pudo guardar el avance.',
        httpStatus: 500
      }
    }));
    window.dispatchEvent(new MessageEvent('message', {
      origin: 'https://bcm-test.seccionamarilla.com',
      data: { payload: { type: 'bcm:business-cancelled', ...commonPayload } }
    }));

    expect(registerBcmEvent).toHaveBeenCalledTimes(3);
    expect(registerBcmEvent.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({
      eventType: 'bcm:business-updated', severity: 'INFO', bcmBusinessId: 12600329
    }));
    expect(registerBcmEvent.calls.argsFor(1)[0]).toEqual(jasmine.objectContaining({
      eventType: 'bcm:business-error', severity: 'ERROR',
      message: 'No se pudo guardar el avance.', errorCode: '500'
    }));
    expect(registerBcmEvent.calls.argsFor(2)[0]).toEqual(jasmine.objectContaining({
      eventType: 'bcm:business-cancelled', severity: 'INFO'
    }));
  });

  it('regresa al detalle y recarga el negocio después de una edición exitosa', () => {
    const business = fixtureBiz();
    const refreshedBusiness = { ...business, businessName: 'Tortilería Doña Luz Puebla' };
    const bcmService = (component as any).bcmEmbedService;
    const businessService = (component as any).businessService;
    spyOn(bcmService, 'registerBcmEvent').and.returnValue(of(void 0));
    const loadDetail = spyOn(businessService, 'loadDetail').and.returnValue(of(refreshedBusiness));
    component.business = business;
    component.internalMode = 'edit';

    window.dispatchEvent(new MessageEvent('message', {
      origin: 'https://bcm-test.seccionamarilla.com',
      data: {
        type: 'bcm:business-updated',
        businessId: 12600329,
        versionNumber: 1,
        commercialName: 'Tortilería Doña Luz Puebla',
        timestamp: '2026-07-22T00:28:29.524Z'
      }
    }));

    expect(component.internalMode).toBe('detail');
    expect(loadDetail).toHaveBeenCalledOnceWith(business.id);
    expect(component.business).toBe(refreshedBusiness);
    expect(component.bcmIframeUrl).toBeNull();
  });

  it('separa pendientes requeridos, omite opcionales vacíos y usa el logo capturado', () => {
    component.business = {
      ...fixtureBiz(),
      fieldsValidation: {
        completo: false,
        campos: [
          { campo: 'Nombre comercial', requerido: true, completo: false, valor: null },
          { campo: 'Sitio web', requerido: false, completo: false, valor: '   ' },
          { campo: 'Correo', requerido: true, completo: true, valor: 'correo@ejemplo.com' },
          { campo: 'Logo', requerido: false, completo: true, valor: 'https://example.com/logo.png' }
        ]
      }
    };

    expect(component.pendingRequiredFields.map(field => field.campo)).toEqual(['Nombre comercial']);
    expect(component.capturedFields.map(field => field.campo)).toEqual(['Correo', 'Logo']);
    expect(component.businessLogoUrl).toBe('https://example.com/logo.png');
    expect(component.fieldDisplayValue(component.capturedFields[1])).toBe('Imagen cargada');
  });

  it('no muestra campos técnicos aunque participen en la validación', () => {
    component.business = {
      ...fixtureBiz(),
      fieldsValidation: {
        completo: true,
        campos: [
          {
            campo: 'ID de categoría',
            requerido: true,
            completo: true,
            valor: '2211603',
            mostrar: false
          },
          {
            campo: 'Giro del negocio',
            requerido: true,
            completo: true,
            valor: 'Taquerías y Torterías',
            mostrar: true
          }
        ]
      }
    };

    expect(component.capturedFields.map(field => field.campo)).toEqual(['Giro del negocio']);
  });

  it('ngOnChanges in add mode produces a blank form', () => {
    component.mode = 'add';
    component.business = null;
    component.ngOnChanges();
    expect(component.form.value.businessName).toBe('');
    expect(component.currentStep).toBe(1);
  });

  it('onSave does not call the service when the form is invalid', () => {
    component.mode = 'add';
    component.business = null;
    component.ngOnChanges(); // blank form → invalid (required fields empty)
    const svc = (component as any).businessService;
    spyOn(svc, 'addBusiness').and.callThrough();
    component.onSave();
    expect(svc.addBusiness).not.toHaveBeenCalled();
  });
});
