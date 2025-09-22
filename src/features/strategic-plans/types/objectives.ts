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

// Objetivos NO configurados (response /objectives/unconfigured)
export type UnconfiguredObjective = {
  id: string;
  name: string;
  description: string | null;
  perspective: string | null;
  order: number;
  strategicPlanId: string;
  objectiveParentId: string | null;
  indicatorId: string | null;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO

  // indicador “por defecto” asociado al objetivo (no configurado)
  indicator?: UnconfiguredIndicator | null;
};

export type UnconfiguredIndicator = {
  id: string;
  name: string;
  description: string | null;
  order: number;
  formula: string | null;

  isDefault: boolean;
  isConfigured: boolean;

  origin: string;
  tendence: string;
  frequency: string;
  measurement: string;
  type: string;
  reference: string;

  periodStart: string | null;
  periodEnd: string | null;

  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};
