/** Permiso del usuario, p.ej. "users.read", "priorities.update" */
export type Permission = string;

/** Unidad de negocio ligera para listados y selección */
export interface BusinessUnitLite {
  id: string;
  name: string;
}

/** Alias semántico para la BU actual */
export interface CurrentBusinessUnit extends BusinessUnitLite {}

/** Payload estandarizado que devuelve /users/me */
export interface MeData {
  id: string;
  email: string;
  username: string;
  ide: string | null;
  telephone: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  isPlatformAdmin: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;

  /** Si el backend requiere selección de BU antes de continuar */
  needsBusinessUnit: boolean;

  /** Unidades de negocio a las que pertenece el usuario */
  businessUnits: BusinessUnitLite[];

  /** Unidad de negocio actualmente activa (o null si no hay) */
  currentBusinessUnit: CurrentBusinessUnit | null;

  /** Permisos efectivos del usuario en la BU activa */
  permissions: Permission[];
}
/** Datos del formulario de login (componente) */
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

/** DTO que se envía al endpoint /api/v1/auth/login */
export interface LoginDto {
  email: string;
  password: string;
}

/** Respuesta de /api/v1/auth/login dentro de { data } */
export interface LoginData {
  accessToken: string;
  refreshToken: string;
}
