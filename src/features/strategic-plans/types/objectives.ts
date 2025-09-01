export type Objective = {
  id: string;
  name: string;
  description?: string | null;
  strategicPlanId: string;
  positionId?: string;
  order?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateObjectivePayload = {
  name: string; // requerido (min 3, max 100) – validación en backend
  description?: string | null; // opcional (min 3, max 250)
  strategicPlanId: string; // UUID requerido
  positionId?: string;
};

export type UpdateObjectivePayload = Partial<CreateObjectivePayload> & {
  isActive?: boolean;
  order?: number | null;
};

export type ReorderObjectivesPayload = {
  strategicPlanId: string;
  items: Array<{
    id: string; // objectiveId
    order: number;
    isActive: boolean;
  }>;
};
