// features/resume/types/positions-overview.ts
export type PositionAnnualTrendPoint = {
  month: number;
  year: number;
  ico: number; // %
  icp: number; // %
  performance: number; // %
  generalAverageProjects: number; // %
};

export type PositionOverviewItem = {
  idPosition: string;
  namePosition: string;
  idUser: string | null;
  nameUser: string | null;
  positionSuperiorId?: string | null;

  ico: number; // % del mes
  icp: number; // % del mes
  performance: number; // % del mes
  generalAverageProjects: number;

  numObjectives: number;
  numPriorities: number;
  numProjects: number;

  /** Solo viene lleno cuando se envía positionId al endpoint */
  annualTrend?: PositionAnnualTrendPoint[];
};

export type PositionsOverviewResponse = {
  listPositions: PositionOverviewItem[];
};
