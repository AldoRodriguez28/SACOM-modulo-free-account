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

  it('remove hace DELETE a /Businesses/{id} con bearer token', () => {
    const id = '019f66ee-b97a-720e-b01b-5942544a11ff';
    repo.remove(id).subscribe();

    const req = http.expectOne(`${BUSINESSES_URL}/${id}`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('remove propaga el error cuando el negocio está publicado (409)', () => {
    const id = '019f66ec-ef05-7166-80d6-2f01bf8ffe1a';
    let captured: unknown;

    repo.remove(id).subscribe({ error: err => (captured = err) });

    const req = http.expectOne(`${BUSINESSES_URL}/${id}`);
    req.flush(
      { title: 'Conflicto de dominio', status: 409, detail: 'No puedes eliminar un negocio publicado.' },
      { status: 409, statusText: 'Conflict' }
    );

    expect((captured as { status: number }).status).toBe(409);
  });

  it('publish hace POST a /{id}/publish con body vacio y mapea publicado a published', () => {
    const id = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
    let status: string | undefined;
    repo.publish(id).subscribe(s => (status = s));

    const req = http.expectOne(`${BUSINESSES_URL}/${id}/publish`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');

    req.flush({ portalBusinessId: id, publicado: true, adnAccountId: 0, adnProductId: 0 });
    expect(status).toBe('published');
  });

  it('unpublish hace POST a /{id}/unpublish con body vacio y mapea despublicado a unpublished', () => {
    const id = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
    let status: string | undefined;
    repo.unpublish(id).subscribe(s => (status = s));

    const req = http.expectOne(`${BUSINESSES_URL}/${id}/unpublish`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');

    req.flush({ portalBusinessId: id, despublicado: true });
    expect(status).toBe('unpublished');
  });
});
