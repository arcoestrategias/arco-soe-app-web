export type BusinessUnitUserMembership = {
  businessUnitId: string;
  businessUnitName: string;
  positionId: string | null;
  positionName: string | null;
  roleId: string | null;
  roleName: string | null;
  isResponsible: boolean;
};

export type BusinessUnitUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userBusinessUnits: BusinessUnitUserMembership[];
};
