import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthResponse } from '../models/auth-response.model';

/** Contrato del API de autenticación por token. */
export interface AuthApi {
  loginByToken(token: string): Observable<AuthResponse>;
  /**
   * Valida el code recibido en /otp/callback. Emite AuthResponse (200) si el OTP
   * es correcto; emite error (4xx) si no lo es.
   */
  validateOtp(code: string): Observable<AuthResponse>;
}

export const AUTH_API = new InjectionToken<AuthApi>('AUTH_API');
