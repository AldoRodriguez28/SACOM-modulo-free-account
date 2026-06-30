import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Business } from '../../domain/business/business.entity';
import { BusinessRepository, CreateBusinessData } from './business.repository';

/**
 * Implementación HTTP del repositorio de negocios.
 * Stub: la estructura está lista; los métodos se implementarán al definir la API real.
 * Cambiar el provider de BUSINESS_REPOSITORY a esta clase activará el backend real.
 */
@Injectable({ providedIn: 'root' })
export class BusinessHttpRepository implements BusinessRepository {
  private notImplemented(method: string): never {
    throw new Error(`BusinessHttpRepository.${method} aún no implementado (pendiente API real).`);
  }

  getAll(): Observable<Business[]> { return this.notImplemented('getAll'); }
  create(_data: CreateBusinessData): Observable<Business> { return this.notImplemented('create'); }
  update(_id: string, _data: Partial<Business>): Observable<Business> { return this.notImplemented('update'); }
  remove(_id: string): Observable<void> { return this.notImplemented('remove'); }
  uploadLogo(_file: File): Observable<string> { return this.notImplemented('uploadLogo'); }
}
