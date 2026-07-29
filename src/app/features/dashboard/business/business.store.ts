import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { Business, BusinessDraft, BusinessStatus } from '../../../domain/business/business.entity';
import { hasPublishSlot, publishedCount } from '../../../domain/business/business.policies';
import { requiredFieldsForPublish } from '../../../domain/business/business.validation';
import {
  applyProgressEdit, canDelete, mergeDraft, nextStatusOnFinalize
} from '../../../domain/business/business.state-machine';
import {
  BUSINESS_REPOSITORY, BusinessRepository, CreateBusinessData
} from '../../../data/business/business.repository';

export interface StatusTransitionResult {
  success: boolean;
  status?: BusinessStatus;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class BusinessStore {
  private readonly repo = inject<BusinessRepository>(BUSINESS_REPOSITORY);

  private readonly _businesses = signal<Business[]>([]);
  readonly businesses = this._businesses.asReadonly();
  readonly publishedCount = computed(() => publishedCount(this._businesses()));
  readonly hasPublishSlot = computed(() => hasPublishSlot(this._businesses()));

  reload(): void {
    this.repo.getAll().subscribe({
      next: list => this._businesses.set(list),
      error: error => {
        console.error('[BusinessStore] No se pudieron cargar los negocios.', error);
        this._businesses.set([]);
      }
    });
  }

  getBusinessById(id: string): Business | undefined {
    return this._businesses().find(b => b.id === id);
  }

  addBusiness(data: CreateBusinessData): Observable<Business> {
    return this.repo.create(data).pipe(
      tap(b => this._businesses.set([...this._businesses(), b]))
    );
  }

  saveProgress(id: string, data: Partial<BusinessDraft>): Observable<Business> {
    const current = this.getBusinessById(id);
    if (!current) return of(undefined as unknown as Business);
    const edited = applyProgressEdit(current, data);
    return this.repo.update(id, edited).pipe(tap(b => this.replace(b)));
  }

  finalize(id: string): Observable<StatusTransitionResult> {
    const current = this.getBusinessById(id);
    if (!current) return of({ success: false, message: 'Negocio no encontrado.' });

    const data = mergeDraft(current);
    const missing = requiredFieldsForPublish(data);
    if (missing.length) {
      return of({ success: false, message: `Para finalizar, completa la información requerida: ${missing.join(', ')}.` });
    }

    const target = nextStatusOnFinalize(current, this.hasPublishSlot());
    const updated: Partial<Business> = { ...data, status: target, draft: null };

    return this.repo.update(id, updated).pipe(
      tap(b => this.replace(b)),
      map(() => this.messageForFinalize(current.status, target))
    );
  }

  updateBusiness(id: string, data: Partial<Business>): Observable<Business> {
    return this.repo.update(id, data).pipe(tap(b => this.replace(b)));
  }

  publish(id: string): Observable<StatusTransitionResult> {
    if (!this.hasPublishSlot()) {
      return of({ success: false, message: 'No es posible publicar este negocio porque ya tienes 3 negocios publicados. Para publicar otro, cambia alguno de los publicados a No publicado.' });
    }
    return this.repo.publish(id).pipe(
      map(status => this.applyStatus(id, status)),
      map(b => ({ success: true, status: b.status, message: 'Tu negocio fue publicado correctamente.' }))
    );
  }

  unpublish(id: string): Observable<Business> {
    return this.repo.unpublish(id).pipe(map(status => this.applyStatus(id, status, true)));
  }

  softDelete(id: string): Observable<StatusTransitionResult> {
    const current = this.getBusinessById(id);
    if (!current) return of({ success: false, message: 'Negocio no encontrado.' });
    if (!canDelete(current)) {
      return of({ success: false, message: 'No puedes eliminar un negocio publicado. Primero cámbialo a No publicado.' });
    }
    return this.repo.remove(id).pipe(
      tap(() => this._businesses.set(this._businesses().filter(b => b.id !== id))),
      map(() => ({ success: true, message: 'El negocio fue eliminado.' }))
    );
  }

  uploadLogo(file: File): Observable<string> {
    return this.repo.uploadLogo(file);
  }

  private replace(b: Business): void {
    this._businesses.set(this._businesses().map(x => (x.id === b.id ? b : x)));
  }

  /** Refleja en memoria el nuevo status devuelto por la API (la respuesta no trae el negocio completo). */
  private applyStatus(id: string, status: BusinessStatus, clearDraft = false): Business {
    const current = this.getBusinessById(id);
    if (!current) return { id, status } as Business;
    const updated: Business = { ...current, status, draft: clearDraft ? null : current.draft };
    this.replace(updated);
    return updated;
  }

  private messageForFinalize(prev: BusinessStatus, target: BusinessStatus): StatusTransitionResult {
    if (prev === 'published') {
      return { success: true, status: 'published', message: 'Los cambios fueron publicados correctamente.' };
    }
    if (target === 'published') {
      return { success: true, status: 'published', message: 'Tu negocio fue publicado correctamente.' };
    }
    return {
      success: true, status: 'unpublished',
      message: 'Ya tienes 3 negocios publicados. Tu negocio fue guardado como No publicado. Para publicarlo, cambia uno de tus negocios publicados a No publicado.'
    };
  }
}
