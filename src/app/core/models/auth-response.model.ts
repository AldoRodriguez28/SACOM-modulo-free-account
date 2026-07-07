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
  user?: {
    id: string;
    email: string;
    contactName?: string;
  };
}

/**
 * Respuesta cruda del endpoint `GET {SHARED_MGMT_URI}/Token/{token}`.
 * `system_info` es un string JSON que contiene `email` y `LeadId`.
 */
export interface TokenValidationResponse {
  token: string;
  user_Id?: string;
  source?: string;
  user_source_id?: string;
  system_info?: string;
  user_name?: string;
  advertiser_id?: string;
  status?: number;
  role?: string;
  expiration_date?: string;
  origin_system?: string;
}
