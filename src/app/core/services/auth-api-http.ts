import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthApi } from './auth-api';
import { AuthResponse, HandshakeResponse, OtpUrlRequest, OtpUrlResponse } from '../models/auth-response.model';

@Injectable({ providedIn: 'root' })
export class AuthApiHttp implements AuthApi {
  private readonly baseUrl = environment.API_URI;

  constructor(private http: HttpClient) {}

  loginByToken(token: string): Observable<AuthResponse> {
    const url = `${this.baseUrl}/Auth/handshake`;
    const params = new HttpParams().set('token', token);
    const headers = new HttpHeaders({ accept: '*/*' });
    return this.http
      .get<HandshakeResponse>(url, { params, headers })
      .pipe(map(raw => this.mapHandshakeResponse(raw)));
  }

  validateOtp(code: string, state: string): Observable<AuthResponse> {
    const url = `${this.baseUrl}/Auth/otp/callback`;
    const params = new HttpParams().set('code', code).set('state', state);
    const headers = new HttpHeaders({ accept: '*/*' });
    return this.http.get<AuthResponse>(url, { params, headers });
  }

  getOtpUrl(params: OtpUrlRequest): Observable<OtpUrlResponse> {
    const url = `${this.baseUrl}/Auth/otp/url`;
    const httpParams = new HttpParams()
      .set('email', params.email)
      .set('leadId', params.leadId)
      .set('origen', params.origen)
      .set('redirectUri', params.redirectUri);
    const headers = new HttpHeaders({ accept: '*/*' });
    return this.http.get<OtpUrlResponse>(url, { params: httpParams, headers });
  }

  /** Convierte la respuesta cruda del handshake en un AuthResponse. */
  private mapHandshakeResponse(raw: HandshakeResponse): AuthResponse {
    const info = raw.system_info;
    const email = info?.email ?? info?.Email;
    const leadId = info?.LeadId ?? info?.leadId;
    const userName = raw.user_name?.trim();

    const response: AuthResponse = { token: raw.token };
    if (email) {
      response.systemInfo = { email: String(email) };
    }
    if (leadId != null) {
      response.leadId = String(leadId);
    }
    if (userName) {
      response.userName = userName;
    }
    if (raw.origin_system) {
      response.origen = raw.origin_system;
    }
    return response;
  }
}
