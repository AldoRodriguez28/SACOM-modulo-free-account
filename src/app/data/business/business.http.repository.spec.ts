import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { BusinessHttpRepository } from './business.http.repository';

const BUSINESSES_URL = `${environment.API_URI}/Businesses`;

describe('BusinessHttpRepository', () => {
  let repo: BusinessHttpRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    sessionStorage.setItem('sa_token', 'test-token');

    TestBed.configureTestingModule({
      providers: [
        BusinessHttpRepository,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    repo = TestBed.inject(BusinessHttpRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('getAll consulta /Businesses con bearer token y mapea la respuesta', () => {
    repo.getAll().subscribe(businesses => {
      expect(businesses.length).toBe(2);
      expect(businesses[0].id).toBe('019f66ee-b97a-720e-b01b-5942544a11ff');
      expect(businesses[0].businessName).toBe('Galleta rosita osito');
      expect(businesses[0].status).toBe('in_progress');
      expect(businesses[1].status).toBe('published');
    });

    const req = http.expectOne(BUSINESSES_URL);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('accept')).toBe('text/plain');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');

    req.flush({
      businesses: [
        {
          portalBusinessId: '019f66ee-b97a-720e-b01b-5942544a11ff',
          businessName: 'Galleta rosita osito',
          status: 'En progreso'
        },
        {
          portalBusinessId: '019f66ec-ef05-7166-80d6-2f01bf8ffe1a',
          businessName: 'Taller Hector',
          status: 'Publicado'
        }
      ],
      total: 2,
      published: 1
    });
  });

  it('getAll prefiere el token de localStorage sobre sessionStorage para pruebas manuales', () => {
    localStorage.setItem('sa_token', 'local-token');
    sessionStorage.setItem('sa_token', 'session-token');

    repo.getAll().subscribe();

    const req = http.expectOne(BUSINESSES_URL);
    expect(req.request.headers.get('Authorization')).toBe('Bearer local-token');
    req.flush({ businesses: [], total: 0, published: 0 });
  });
});
