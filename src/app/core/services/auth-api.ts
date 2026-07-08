import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthResponse, OtpUrlRequest, OtpUrlResponse } from '../models/auth-response.model';

/** Contrato del API de autenticación por token. */
export interface AuthApi {
  loginByToken(token: string): Observable<AuthResponse>;
  /**
   * Canjea el `code` y `state` recibidos en /otp/callback contra el backend.
   * Emite AuthResponse (200) si el OTP es correcto; emite error (4xx) si no lo es.
   */
  validateOtp(code: string, state: string): Observable<AuthResponse>;
  /**
   * Obtiene la URL de inicio del flujo de verificación OTP por correo, armada por
   * el backend a partir del email, leadId, origen y redirectUri.
   */
  getOtpUrl(params: OtpUrlRequest): Observable<OtpUrlResponse>;
}

export const AUTH_API = new InjectionToken<AuthApi>('AUTH_API');
