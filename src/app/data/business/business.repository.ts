import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Business, BusinessStatus } from '../../domain/business/business.entity';

export type CreateBusinessData = Omit<Business, 'id' | 'userId' | 'status' | 'createdAt' | 'draft'>;

export interface BusinessRepository {
  getAll(): Observable<Business[]>;
  getById(id: string): Observable<Business>;
  create(data: CreateBusinessData): Observable<Business>;
  update(id: string, data: Partial<Business>): Observable<Business>;
  publish(id: string): Observable<BusinessStatus>;
  unpublish(id: string): Observable<BusinessStatus>;
  remove(id: string): Observable<void>;
  uploadLogo(file: File): Observable<string>;
}

export const BUSINESS_REPOSITORY = new InjectionToken<BusinessRepository>('BUSINESS_REPOSITORY');
