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

export type ConfigureObjectiveMonths = { month: number; year: number };

export type ConfigureObjectiveDto = {
  objectiveId: string;
  objective?: {
    goalValue?: number;
    name?: string;
    description?: string;
    perspective?: "FIN" | "CLI" | "PRO" | "PER";
    level?: "EST" | "OPE";
    valueOrientation?: "CRE" | "REN";
    objectiveParentId?: string | null;
    positionId?: string;
    strategicPlanId?: string;
    status?: string; // valores exactos NO ENCONTRADO; de ejemplo has usado "OPE"
  };
  indicator?: {
    name?: string;
    description?: string;
    formula?: string;
    origin?: "MAN" | "AUT";
    tendence?: "POS" | "NEG" | "MAN" | "HIT";
    frequency?: "TRI" | "QTR" | "MES" | "STR" | "ANU" | "PER";
    measurement?: "POR" | "RAT" | "UNI" | "MON" | "UNC";
    type?: "RES" | "GES";
    reference?: string;
    periodStart?: string; // ISO (YYYY-MM-DD)
    periodEnd?: string; // ISO (YYYY-MM-DD)
  };
  rangeExceptional?: number;
  rangeInacceptable?: number;
  months?: ConfigureObjectiveMonths[]; // solo si frequency = "PER"
};

// ❷ Respuesta (según tu ejemplo)
export type ConfigureObjectiveResponse = {
  objective: {
    id: string;
    name: string;
    description: string | null;
    perspective: "FIN" | "CLI" | "PRO" | "PER";
    order: number;
    strategicPlanId: string;
    objectiveParentId: string | null;
    indicatorId: string;
    isActive: boolean;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string;
  };
  indicatorUpdated: boolean;
  goalsRegenerated: boolean;
  monthsCount: number;
};
