export type StrategicPlan = {
  id: string;
  name: string;
  description?: string | null;
  period: number;
  fromAt: string; // ISO o YYYY-MM-DD (según tu backend)
  untilAt: string; // ISO o YYYY-MM-DD
  mission?: string | null;
  vision?: string | null;
  competitiveAdvantage?: string | null;
  businessUnitId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateStrategicPlanPayload = {
  name: string;
  description?: string | null;
  period: number;
  fromAt: string; // 'YYYY-MM-DD' desde el input date
  untilAt: string; // 'YYYY-MM-DD'
  mission?: string | null;
  vision?: string | null;
  competitiveAdvantage?: string | null;
  businessUnitId: string;
};

export type UpdateStrategicPlanPayload = Partial<CreateStrategicPlanPayload> & {
  isActive?: boolean;
};

export type StrategicSuccessFactor = {
  id: string;
  name: string;
  description?: string | null;
  strategicPlanId: string;
  order?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateStrategicSuccessFactorPayload = {
  name: string;                    // requerido (min 3, max 100) – validación en backend
  description?: string | null;     // opcional (min 3, max 250)
  strategicPlanId: string;         // UUID requerido
};

export type UpdateStrategicSuccessFactorPayload = Partial<CreateStrategicSuccessFactorPayload> & {
  isActive?: boolean;
  order?: number | null;
};

export type ReorderStrategicSuccessFactorsPayload = {
  strategicPlanId: string;
  items: Array<{
    id: string;          // strategicSuccessFactorId
    order: number;
    isActive: boolean;
  }>;
};