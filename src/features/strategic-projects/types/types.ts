export interface Project {
  id: number;
  iniciales: string;
  color: string;
  titulo: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  cumplimiento: number;
  metaEstrategica: string;
  presupuestoProyecto: number;
  presupuestoReal: number;
  totalTareas: number;
  tareasCompletadas: number;
  factoresClave: number;
}

export interface Factor {
  id: number;
  descripcion: string;
  resultado: string;
  expandido: boolean;
  enEdicion: boolean;
  esNuevo?: boolean;
  orden: number;
  activo: boolean;
  tareas: Task[];
}

export interface Task {
  id: number;
  nombre: string;
  justificacion: string;
  entregable: string;
  responsable: string;
  apoyos: string[];
  fechaInicio: string;
  fechaFin: string;
  inversion: number;
  isFinished: boolean;
  limitacion: string;
  observacion: string;
  metodologia: string;
  enEdicion: boolean;
  esNuevo?: boolean;
  orden: number;
  activo: boolean;
}
