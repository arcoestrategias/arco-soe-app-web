export type StrategicValue = {
  id: string;
  name: string;
  description?: string | null;
  strategicPlanId: string;
  order?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// Para tu conveniencia en el front, el create recibe el planId por separado (query string)
export type CreateStrategicValueArgs = {
  strategicPlanId: string; // requerido (query)
  name: string; // requerido (3..150)
  description?: string | null; // opcional (0..500)
  order?: number | null; // opcional (backend resuelve si no llega)
};

export type UpdateStrategicValuePayload = Partial<CreateStrategicValueArgs> & {
  isActive?: boolean; // permite inactivar con PATCH /:id
  // order?: number | null;     // opcional si necesitas ajustar orden desde update
};

export type ReorderStrategicValuesPayload = {
  strategicPlanId: string;
  items: Array<{
    id: string; // strategicValueId
    order: number;
    isActive: boolean;
  }>;
};
