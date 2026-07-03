/** Información del sistema embebida en el token de validación. */
export interface SystemInfo {
  email: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  /** Token de sesión devuelto por el backend. */
  token: string;
  /** Identificador del lead asociado al enlace de validación. */
  leadId?: string;
  /** Datos extraídos del token (contiene el email, entre otros). */
  systemInfo?: SystemInfo;
  user?: {
    id: string;
    email: string;
    contactName?: string;
  };
}
