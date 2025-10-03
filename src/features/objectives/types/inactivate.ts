// Item base: sin cambios
export type ObjectiveAssociationItem = {
  id: string;
  name: string;
  status?: string | null;
  fromAt?: string | null;
  untilAt?: string | null;
  isActive?: boolean | null;
};

// NUEVO: agrupación por posición para prioridades
export type ObjectiveAssociationsByPositionItem = {
  positionId: string;
  positionName: string;
  priorities: ObjectiveAssociationItem[];
};

// v2 del contrato de respuesta
export type InactivateObjectiveResult = {
  blocked: boolean;
  message?: string;
  associations?: {
    projects?: ObjectiveAssociationItem[];

    // NUEVO contrato
    prioritiesByPosition?: ObjectiveAssociationsByPositionItem[];

    /** @deprecated - soporte temporal para back-compat */
    priorities?: ObjectiveAssociationItem[];
  };
};
