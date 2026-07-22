import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BcmEmbedTokenResponse {
  token: string;
  embedUrl: string;
  expirationDateUtc: string;
}

export interface BcmBusinessRegisteredPayload {
  type: 'bcm:business-registered';
  businessId: number;
  versionNumber: number;
  commercialName: string;
  categoryCode: string;
  categoryName?: string;
  townCode: string;
  townName?: string;
  timestamp: string;
  targetOrigin?: string;
}

export interface BcmEditEventPayload {
  type: 'bcm:business-updated' | 'bcm:business-error' | 'bcm:business-cancelled';
  businessId: number;
  versionNumber: number;
  commercialName: string;
  errorMessage?: string;
  httpStatus?: number;
  timestamp: string;
  targetOrigin?: string;
}

export interface BcmErrorPayload {
  type:
    | 'bcm:error'
    | 'bcm:business-registration-error'
    | 'bcm:business-conflict';

  message?: string;
  errorMessage?: string;
  errorCode?: string;
  httpStatus?: number;

  businessId?: number;
  versionNumber?: number;

  commercialName?: string;
  categoryCode?: string;
  categoryName?: string;
  townCode?: string;
  townName?: string;

  timestamp?: string;
  targetOrigin?: string;
  details?: unknown;
}

export interface RegisterBcmEventRequest {
  eventType: string;
  severity: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  errorCode?: string;
  bcmBusinessId?: number | null;
  bcmBusinessVersionNumber?: number | null;
  origin?: string;
  targetOrigin?: string;
  occurredAtUtc?: string;
  rawPayload?: string;
  details?: string;
}

export interface RegisterBusinessRequest {
  businessName: string;
  categoryName: string;
  population: string;
  publicUrl: string;
  bcmBusinessId: number;
  bcmBusinessVersionNumber: number;
}

@Injectable({ providedIn: 'root' })
export class BcmEmbedService {
  constructor(private http: HttpClient) {}

  generateAddToken(): Observable<BcmEmbedTokenResponse> {
    return this.http.post<BcmEmbedTokenResponse>(
      `${environment.API_URI}/businesses/bcm/token/add`,
      {},
      { headers: this.buildHeaders() }
    );
  }

  generateEditToken(portalBusinessId: string): Observable<BcmEmbedTokenResponse> {
    return this.http.post<BcmEmbedTokenResponse>(
      `${environment.API_URI}/businesses/${encodeURIComponent(portalBusinessId)}/bcm/token/edit`,
      {},
      { headers: this.buildHeaders() }
    );
  }

  registerBusiness(data: RegisterBusinessRequest): Observable<unknown> {
    return this.http.post(
      `${environment.API_URI}/Businesses`,
      data,
      { headers: this.buildHeaders() }
    );
  }

  registerBcmEvent(data: RegisterBcmEventRequest): Observable<void> {
    return this.http.post<void>(
      `${environment.API_URI}/bcm/events`,
      data,
      { headers: this.buildHeaders() }
    );
  }

  private buildHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('sa_token')
      ?? sessionStorage.getItem('token')
      ?? localStorage.getItem('sa_token')
      ?? localStorage.getItem('token');

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
