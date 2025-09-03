export type StrategicProject = {
  id: string;
  name: string;
  description?: string | null;
  fromAt: string; // YYYY-MM-DD
  untilAt: string; // YYYY-MM-DD
  order?: number | null;
  strategicPlanId: string;
  objectiveId?: string | null;
  positionId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateStrategicProjectPayload = {
  name: string; // requerido (3..150)
  description?: string | null; // opcional (0..500)
  fromAt?: string; // opcional; si no llega -> usa fromAt del plan
  untilAt?: string; // opcional; si no llega -> usa untilAt del plan
  order?: number | null; // opcional
  strategicPlanId: string; // requerido
  objectiveId?: string | null; // opcional
  positionId: string; // requerido (CEO)
  budget?: number | null;
};

export type UpdateStrategicProjectPayload =
  Partial<CreateStrategicProjectPayload> & {
    isActive?: boolean;
  };

export type SetStrategicProjectActivePayload = { isActive: boolean };

export type ReorderStrategicProjectsPayload = {
  strategicPlanId: string;
  items: Array<{
    id: string; // strategicProjectId
    order: number;
    isActive: boolean;
  }>;
};
