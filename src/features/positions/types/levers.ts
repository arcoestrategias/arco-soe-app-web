export type Lever = {
  id: string;
  name: string;
  description?: string | null;
  positionId: string;
  order?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// Body del create (el positionId va por query param)
export type CreateLeverBody = {
  name: string; // requerido (3..150)
  description?: string | null; // opcional (0..500)
  positionId: string;
};

export type UpdateLeverPayload = Partial<CreateLeverBody> & {
  isActive?: boolean;
  order?: number | null;
};

export type ReorderLeversPayload = {
  positionId: string;
  items: Array<{
    id: string; // leverId
    order: number;
    isActive: boolean;
  }>;
};
