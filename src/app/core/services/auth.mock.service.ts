import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User } from '../models/user.model';
import { AuthResponse } from '../models/auth-response.model';

export const DEMO_USER: User = {
  id: 'usr-001',
  email: 'demo@seccionamarilla.com',
  contactName: 'Juan Pérez',
  phone: '',
  password: 'Demo1234'
};

@Injectable({ providedIn: 'root' })
export class AuthMockService {
  private readonly KEY = 'sa_user';
  private readonly TOKEN_KEY = 'sa_token';

  currentUser = signal<User | null>(this.load());

  private load(): User | null {
    const raw = sessionStorage.getItem(this.KEY);
    return raw ? JSON.parse(raw) : null;
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  setPassword(email: string, contactName: string, password: string): Observable<void> {
    const user: User = {
      id: crypto.randomUUID(),
      email,
      contactName,
      phone: '',
      password
    };
    sessionStorage.setItem(this.KEY, JSON.stringify(user));
    this.currentUser.set(user);
    return of(void 0);
  }

  /** Mock OTP: en entorno real enviaría un código; aquí autentica directamente */
  loginOtp(email: string): Observable<boolean> {
    const user: User = { ...DEMO_USER, email };
    sessionStorage.setItem(this.KEY, JSON.stringify(user));
    this.currentUser.set(user);
    return of(true);
  }

  /** @deprecated Mantener para compatibilidad con código existente */
  login(email: string, password: string): Observable<boolean> {
    return this.loginOtp(email);
  }

  /** Persiste la sesión a partir de la respuesta del login por token */
  setSession(res: AuthResponse): void {
    if (res.token) {
      sessionStorage.setItem(this.TOKEN_KEY, res.token);
    }
    const user: User = {
      id: res.user?.id ?? crypto.randomUUID(),
      email: res.user?.email ?? '',
      contactName: res.user?.contactName ?? '',
      phone: '',
      password: ''
    };
    sessionStorage.setItem(this.KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  logout(): void {
    sessionStorage.removeItem(this.KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
  }
}
