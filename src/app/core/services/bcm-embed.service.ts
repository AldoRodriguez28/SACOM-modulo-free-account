import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BcmEmbedTokenResponse {
  token: string;
  embedUrl: string;
  expirationDateUtc: string;
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

  generateEditToken(): Observable<BcmEmbedTokenResponse> {
    return this.http.post<BcmEmbedTokenResponse>(
      `${environment.API_URI}/businesses/bcm/token/edit`,
      {},
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
