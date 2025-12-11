export interface Role {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  userCount?: number; // Puede venir de la API o no
  isActive?: boolean;
}

export interface CreateRolePayload {
  name: string;
  description?: string | null;
}

export interface UpdateRolePayload extends CreateRolePayload {}

// Permiso completo, de GET /permissions
export interface SystemPermission {
  id: string;
  name: string;
  description: string | null;
  moduleId: string;
}

export interface RolePermission {
  id: string;
  name: string;
  description: string | null;
  module: string;
  isActive: boolean;
}

export interface UpdateRolePermissionsPayload {
  permissions: { id: string; isActive: boolean }[];
}
