// features/objectives/types/ico-board.ts

// Punto mensual por objetivo (tal como lo devuelve el back)
export type IcoMonthlyPoint = {
  // existentes
  month: number; // 1..12
  year: number; // p.ej. 2025
  ico: number; // índice (sin redondeo)
  isMeasured: boolean; // existe ObjectiveGoal ese mes
  hasCompliance: boolean; // ObjectiveGoal tiene indexCompliance
  lightNumeric: number | null; // 1=verde, 2=amarillo, 3=rojo (si aplica)
  lightColorHex: string | null; // color de la celda (si aplica)

  // NUEVOS (opcionales para no romper usos previos)
  id?: string;
  goalPercentage?: number | null;
  goalValue?: number | null;
  realPercentage?: number | null;
  realValue?: number | null;
  indexCompliance?: number | null;
  score?: number | null;

  // rangos/semáforo del rendimiento
  rangeExceptional?: number | null;
  rangeInacceptable?: number | null;
  indexPerformance?: number | null;

  // base de cálculo y luz "numérica" del backend
  baseValue?: number | null;
  light?: number | null; // OJO: el backend envía `light`; mantenemos también `lightNumeric` arriba

  // trazabilidad / anotaciones
  observation?: string | null;
  action?: string | null;

  // metadatos
  objectiveId?: string;
  isActive?: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string | null; // ISO datetime
  updatedAt?: string | null; // ISO datetime
};

// Promedio mensual (pie de la tabla)
export type IcoBoardMonthlyAverage = {
  month: number;
  year: number;
  averageIco: number; // sin redondeo
  totalObjectives: number;
  measuredCount: number;
  unmeasuredCount: number;
  lightNumeric?: number | null;
  lightColorHex?: string | null;
};

// Resumen que ahora envía el backend
export type IcoBoardResume = {
  generalAverage: number;
  activeIndicators: number;
  lastActiveMonth: {
    month: number;
    year: number;
    label: string;
  };
};

// Item de lista (objetivo + indicador + serie mensual)
export type IcoBoardListItem = {
  objective: {
    id: string;
    name: string;
    description?: string | null;
    order?: number | null;
    perspective?: string | null;
    level?: string | null;
    valueOrientation?: string | null;
    goalValue?: number | null;
    status?: string | null;
    positionId: string;
    strategicPlanId: string;
    objectiveParentId?: string | null;
    isActive: boolean;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt?: string;
    updatedAt?: string;
    indicator: {
      id: string;
      name: string;
      description?: string | null;
      order?: number | null;
      formula?: string | null;
      isDefault?: boolean;
      isConfigured?: boolean;
      origin?: string | null;
      tendence?: string | null;
      frequency?: string | null;
      measurement?: string | null;
      type?: string | null;
      reference?: string | null;
      periodStart?: string | null;
      periodEnd?: string | null;
      isActive?: boolean;
      createdBy?: string | null;
      updatedBy?: string | null;
      createdAt?: string | null;
      updatedAt?: string | null;
    };
    icoMonthly: IcoMonthlyPoint[];
    goalStatus?: {
      pendingCount: number;
      statusLabel: string;
      lightColorHex: string;
    };
  };
};

// Envelope de datos del tablero ICO
export type IcoBoardData = {
  resume: IcoBoardResume;
  listObjectives: IcoBoardListItem[];
  monthlyAverages: IcoBoardMonthlyAverage[];
};
