import { Injectable } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';
import { AuthApi } from './auth-api';
import { AuthResponse, OtpUrlRequest, OtpUrlResponse, SystemInfo } from '../models/auth-response.model';

/**
 * Implementación mock de {@link AuthApi} mientras la API real no está disponible.
 * Decodifica el token recibido en /validacion/:token para extraer el systeminfo
 * (email) y el leadid. Si el token no es un JWT decodificable, devuelve datos
 * de demostración para poder probar el frontend con cualquier valor.
 */
@Injectable({ providedIn: 'root' })
export class AuthApiMock implements AuthApi {
  private readonly DEMO: AuthResponse = {
    token: 'mock-session-token',
    leadId: 'LEAD-DEMO-001',
    systemInfo: { email: 'demo@seccionamarilla.com' }
  };

  loginByToken(token: string): Observable<AuthResponse> {
    const payload = this.decodeJwt(token);
    const systemInfo = this.parseSystemInfo(payload?.['systeminfo'] ?? payload?.['systemInfo']);

    const email = systemInfo?.['email'] ?? systemInfo?.['Email'];
    const leadId =
      systemInfo?.['leadid'] ??
      systemInfo?.['leadId'] ??
      payload?.['leadid'] ??
      payload?.['leadId'];

    const response: AuthResponse = email
      ? {
          token: 'mock-session-token',
          leadId: leadId != null ? String(leadId) : this.DEMO.leadId,
          systemInfo: { ...(systemInfo as SystemInfo), email: String(email) }
        }
      : this.DEMO;

    // Simula latencia de red.
    return of(response).pipe(delay(400));
  }

  /**
   * Simula el endpoint /Auth/otp/callback.
   * - code vacío o que contenga "error"/"invalid"/"fail" => error 401 (OTP inválido).
   * - cualquier otro code => 200 con sesión simulada.
   */
  validateOtp(code: string, _state: string): Observable<AuthResponse> {
    const invalido = !code || /error|invalid|fail/i.test(code);

    if (invalido) {
      return timer(400).pipe(
        mergeMap(() => throwError(() => ({ status: 401, message: 'OTP inválido' })))
      );
    }

    return of<AuthResponse>({
      token: 'mock-session-token',
      user: { id: 'usr-001', email: this.DEMO.systemInfo!.email }
    }).pipe(delay(400));
  }

  /** Simula el endpoint /Auth/otp/url devolviendo una url de OTP de demostración. */
  getOtpUrl(_params: OtpUrlRequest): Observable<OtpUrlResponse> {
    return of<OtpUrlResponse>({
      url: 'https://test-otp.seccionamarilla.com.mx/otp/start?purpose=demo&clientid=demo&data=mock',
    }).pipe(delay(400));
  }

  /** Decodifica el payload de un JWT sin verificar la firma. */
  private decodeJwt(token: string): Record<string, any> | null {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  /** systeminfo puede venir como objeto o como string JSON dentro del token. */
  private parseSystemInfo(value: unknown): Record<string, any> | null {
    if (!value) return null;
    if (typeof value === 'object') return value as Record<string, any>;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return null;
  }
}
