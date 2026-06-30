import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Business } from '../../domain/business/business.entity';

export type CreateBusinessData = Omit<Business, 'id' | 'userId' | 'status' | 'createdAt' | 'draft'>;

export interface BusinessRepository {
  getAll(): Observable<Business[]>;
  create(data: CreateBusinessData): Observable<Business>;
  update(id: string, data: Partial<Business>): Observable<Business>;
  remove(id: string): Observable<void>;
  uploadLogo(file: File): Observable<string>;
}

export const BUSINESS_REPOSITORY = new InjectionToken<BusinessRepository>('BUSINESS_REPOSITORY');
