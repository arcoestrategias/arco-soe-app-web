export type UserBusinessUnitLink = {
  businessUnitId: string;
  positionId?: string | null;
  roleId: string;
  isResponsible: boolean;
};

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string | null;
  ide?: string | null;
  telephone?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isEmailConfirmed?: boolean; // ← para mostrar el check “Enviar confirmación”
  userBusinessUnits?: UserBusinessUnitLink[] | null; // ← NUEVO
};

export type CreateUserPayload = {
  email: string;
  firstName: string;
  lastName: string;
  username?: string | null;
  ide?: string | null;
  telephone?: string | null;
  password: string;
};

export type CreateUserAssignPayload = CreateUserPayload & {
  roleId: string;
  businessUnitId: string;
};

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password">> & {
  isActive?: boolean;
  roleId?: string;
  companyId?: string;
  businessUnitId?: string;
  positionId?: string | null;
  isResponsible?: boolean;
  copyPermissions?: boolean;
  sendEmailConfirmation?: boolean;
};

export type Role = { id: string; name: string };
