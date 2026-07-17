import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Business } from '../../domain/business/business.entity';
import { BusinessRepository, CreateBusinessData } from './business.repository';
import { BusinessesResponseDto, businessMapper } from './business.mapper';

@Injectable({ providedIn: 'root' })
export class BusinessHttpRepository implements BusinessRepository {
  private readonly businessesUrl = `${environment.API_URI}/Businesses`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Business[]> {
    return this.http
      .get<unknown>(this.businessesUrl, {
        headers: this.buildHeaders()
      })
      .pipe(map(response => this.toBusinesses(response).map(businessMapper.toDomain)));
  }

  create(_data: CreateBusinessData): Observable<Business> {
    return this.notImplemented('create');
  }

  update(_id: string, _data: Partial<Business>): Observable<Business> {
    return this.notImplemented('update');
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.businessesUrl}/${id}`, {
      headers: this.buildHeaders()
    });
  }

  uploadLogo(_file: File): Observable<string> {
    return this.notImplemented('uploadLogo');
  }

  private buildHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ accept: 'text/plain' });
    const token = localStorage.getItem('sa_token')
      ?? localStorage.getItem('token')
      ?? sessionStorage.getItem('sa_token')
      ?? sessionStorage.getItem('token');

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private toBusinesses(response: unknown): BusinessesResponseDto['businesses'] {
    if (typeof response === 'string') {
      return this.toBusinesses(JSON.parse(response));
    }

    if (!response || typeof response !== 'object') {
      return [];
    }

    const body = response as Partial<BusinessesResponseDto> & {
      Businesses?: BusinessesResponseDto['businesses'];
    };

    return body.businesses ?? body.Businesses ?? [];
  }

  private notImplemented(method: string): never {
    throw new Error(`BusinessHttpRepository.${method} aun no implementado (pendiente API real).`);
  }
}
