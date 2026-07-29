import { Injectable } from '@angular/core';
import { Observable, map, of, throwError } from 'rxjs';
import { Business, BusinessStatus } from '../../domain/business/business.entity';
import { BusinessRepository, CreateBusinessData } from './business.repository';
import mockData from '../../../assets/mock-data.json';

@Injectable({ providedIn: 'root' })
export class BusinessMockRepository implements BusinessRepository {
  private readonly KEY = 'sa_businesses';

  getAll(): Observable<Business[]> {
    return of(this.load());
  }

  create(data: CreateBusinessData): Observable<Business> {
    const newBiz: Business = {
      ...data,
      id: crypto.randomUUID(),
      userId: 'usr-001',
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      draft: null
    };
    this.persist([...this.load(), newBiz]);
    return of(newBiz);
  }

  update(id: string, data: Partial<Business>): Observable<Business> {
    const current = this.load();
    const exists = current.some(b => b.id === id);
    if (!exists) {
      return throwError(() => new Error(`Business not found: ${id}`));
    }
    const list = current.map(b => (b.id === id ? { ...b, ...data } : b));
    this.persist(list);
    return of(list.find(b => b.id === id)!);
  }

  publish(id: string): Observable<BusinessStatus> {
    return this.update(id, { status: 'published' }).pipe(map(b => b.status));
  }

  unpublish(id: string): Observable<BusinessStatus> {
    return this.update(id, { status: 'unpublished', draft: null }).pipe(map(b => b.status));
  }

  remove(id: string): Observable<void> {
    this.persist(this.load().filter(b => b.id !== id));
    return of(void 0);
  }

  uploadLogo(file: File): Observable<string> {
    return new Observable<string>(observer => {
      const reader = new FileReader();
      reader.onload = () => { observer.next(reader.result as string); observer.complete(); };
      reader.onerror = () => observer.error(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private load(): Business[] {
    const raw = sessionStorage.getItem(this.KEY);
    if (raw) {
      const parsed: Business[] = JSON.parse(raw);
      // Migración retrocompatible: completar campos ausentes.
      return parsed.map(b => ({
        ...b,
        status: b.status ?? ('published' as BusinessStatus),
        createdAt: b.createdAt ?? new Date().toISOString(),
        draft: b.draft ?? null
      }));
    }
    return mockData.businesses as unknown as Business[];
  }

  private persist(list: Business[]): void {
    sessionStorage.setItem(this.KEY, JSON.stringify(list));
  }
}
