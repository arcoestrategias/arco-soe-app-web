export type Position = {
  id: string;
  name: string;
  businessUnitId: string;
  businessUnitName: string;
  userId: string | null;
  userFullName: string | null;
  isCeo: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  mission?: string | null;
  vision?: string | null;
};

export type CreatePositionPayload = {
  name: string;
  businessUnitId: string;
  userId: string;
  isCeo: boolean;
};

export type UpdatePositionPayload = Partial<CreatePositionPayload> & {
  isActive?: boolean;
  mission?: string | null;
  vision?: string | null;
};
