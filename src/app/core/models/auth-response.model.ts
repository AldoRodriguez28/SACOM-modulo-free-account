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
  /** Nombre del usuario recibido en el token. */
  userName?: string;
  /** Sistema de origen del lead (viene de `origin_system` en el handshake). */
  origen?: string;
  user?: {
    id: string;
    email: string;
    contactName?: string;
  };
}

/** Parámetros para `GET {API_URI}/Auth/otp/url`. */
export interface OtpUrlRequest {
  email: string;
  leadId: string;
  origen: string;
  redirectUri: string;
}

/** Respuesta de `GET {API_URI}/Auth/otp/url`: url de inicio del flujo OTP. */
export interface OtpUrlResponse {
  url: string;
}

/**
 * Respuesta cruda del endpoint `GET {API_URI}/Auth/handshake?token={token}`.
 * `system_info` viene como objeto con `email` y `LeadId`.
 */
export interface HandshakeResponse {
  token: string;
  user_Id?: string;
  source?: string;
  user_source_id?: string;
  ctcr_sys_dt?: string;
  ctcr_access_dt?: string;
  system_info?: {
    email?: string;
    Email?: string;
    LeadId?: number | string;
    leadId?: number | string;
  };
  user_name?: string;
  advertiser_id?: string;
  bc_product_id?: number;
  case_id?: number;
  id_cotizacion?: string;
  status?: number;
  role?: string;
  expiration_date?: string;
  /** Sistema de origen del lead (p.ej. "SACOM-PORTAL"). */
  origin_system?: string;
}
