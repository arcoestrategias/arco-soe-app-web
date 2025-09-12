export interface RoleSummary {
  id: number;
  cargo: string;
  prioridades: number;
  objetivos: number;
  proyectos: number;
  ico: number;
  icp: number;
}

export interface ResumenResponse {
  icoPromedio: number;
  topRoles: RoleSummary[];
  allRoles: RoleSummary[];
}
