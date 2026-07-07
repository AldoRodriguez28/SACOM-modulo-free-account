import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthApi } from './auth-api';
import { AuthResponse, TokenValidationResponse } from '../models/auth-response.model';

@Injectable({ providedIn: 'root' })
export class AuthApiHttp implements AuthApi {
  private readonly baseUrl = environment.API_URI;

  constructor(private http: HttpClient) {}

  loginByToken(token: string): Observable<AuthResponse> {
    const url = `${environment.SHARED_MGMT_URI}/Token/${token}`;
    const headers = new HttpHeaders({
      Authorization: this.basicAuthHeader(),
    });
    return this.http
      .get<TokenValidationResponse>(url, { headers })
      .pipe(map(raw => this.mapTokenResponse(raw)));
  }

  /** Construye el header Basic Auth con las credenciales del entorno. */
  private basicAuthHeader(): string {
    return 'Basic ' + btoa(`${environment.SHARED_MGMT_USER}:${environment.SHARED_MGMT_PASS}`);
  }

  validateOtp(code: string): Observable<AuthResponse> {
    const url = `${this.baseUrl}/Auth/otp/callback`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    const body = { code };
    return this.http.post<AuthResponse>(url, body, { headers });
  }

  /** Convierte la respuesta cruda del endpoint Token en un AuthResponse. */
  private mapTokenResponse(raw: TokenValidationResponse): AuthResponse {
    const info = this.parseSystemInfo(raw.system_info);
    const email = info['email'] ?? info['Email'];
    const leadId = info['LeadId'] ?? info['leadId'];
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
    return response;
  }

  /** `system_info` viene como string JSON; si no es parseable devuelve {}. */
  private parseSystemInfo(value: string | undefined): Record<string, any> {
    if (!value) return {};
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
}
