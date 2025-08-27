export type BusinessUnit = {
  id: string;
  name: string;
  description?: string | null;
  ide?: string | null; // máx 13
  legalRepresentativeName?: string | null; // máx 250
  address?: string | null; // máx 250
  phone?: string | null; // máx 50
  order?: number | null;
  companyId: string; // requerido
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  company?: { id: string; name: string } | null; // opcional (si tu API lo envía)
};

export type CreateBusinessUnitPayload = {
  name: string;
  description?: string | null;
  ide?: string | null;
  legalRepresentativeName?: string | null;
  address?: string | null;
  phone?: string | null;
  order?: number | null;
  companyId: string;
};

export type UpdateBusinessUnitPayload = Partial<CreateBusinessUnitPayload> & {
  isActive?: boolean;
};
