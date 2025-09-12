// Nodo que devuelve tu API
export type OrgChartNodeDTO = {
  idPosition: string;
  namePosition: string;
  idUser: string | null;
  nameUser: string | null;
  positionSuperiorId: string | null;
  ico: number;
  icp: number;
  performance: number;
  generalAverageProjects: number;
  numObjectives: number;
  numPriorities: number;
  numProjects: number;
  annualTrend: Array<{
    month: number;
    year: number;
    ico: number;
    icp: number;
    performance: number;
    generalAverageProjects: number;
  }>;
  children: OrgChartNodeDTO[];
};

export type OrgChartOverviewData = {
  root: OrgChartNodeDTO;
  orphans: OrgChartNodeDTO[];
};

export type OrgChartOverviewResponse = {
  success: boolean;
  message: string;
  statusCode: number;
  data: OrgChartOverviewData;
};

// (Tipo que usa la tarjeta visual)
export type Cargo = {
  id: string;
  nombre: string; // position name
  colaborador: string; // user name
  ico: number;
  icp: number;
  performance: number; // 👈 nuevo: usamos el performance del API
  avanceProyectos: number; // mapea generalAverageProjects (si lo quieres mostrar en otro lado)
  proyectosAtrasados: number;
  nivel: number;
  posicion: { x: number; y: number };
  expandido: boolean;
  hijos?: Cargo[];
  photo?: string; // opcional, por si luego tienes avatar
};
