import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthApi } from './auth-api';
import { AuthResponse } from '../models/auth-response.model';

@Injectable({ providedIn: 'root' })
export class AuthApiHttp implements AuthApi {
  private readonly baseUrl = environment.API_URI;

  constructor(private http: HttpClient) {}

  loginByToken(token: string): Observable<AuthResponse> {
    const url = `${this.baseUrl}/Auth/login-by-token`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    const body = { token };
    return this.http.post<AuthResponse>(url, body, { headers });
  }

  validateOtp(code: string): Observable<AuthResponse> {
    const url = `${this.baseUrl}/Auth/otp/callback`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    const body = { code };
    return this.http.post<AuthResponse>(url, body, { headers });
  }
}
