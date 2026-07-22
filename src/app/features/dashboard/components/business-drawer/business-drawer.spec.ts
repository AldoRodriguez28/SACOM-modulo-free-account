import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { of } from 'rxjs';
import { BUSINESS_REPOSITORY } from '../../../../data/business/business.repository';
import { BusinessDrawer } from './business-drawer';

const mockRepo = {
  getAll: () => of([]),
  getById: (_id: string) => of({} as any),
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
