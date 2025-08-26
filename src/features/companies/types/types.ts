export type Company = {
  id: string;
  name: string;
  description?: string | null;
  ide: string;
  legalRepresentativeName?: string | null;
  address?: string | null;
  phone?: string | null;
  order?: number | null;
  isPrivate?: boolean | null;
  isGroup?: boolean | null;
  isActive: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCompanyPayload = {
  name: string;
  ide: string;
  description?: string;
  legalRepresentativeName?: string;
  address?: string;
  phone?: string;
  order?: number | null;
  isPrivate?: boolean;
  isGroup?: boolean;
};

export type UpdateCompanyPayload = Partial<CreateCompanyPayload> & {
  isActive?: boolean | null;
};
