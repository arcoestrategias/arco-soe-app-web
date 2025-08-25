export interface Company {
  id: string;
  nombre: string;
  identificacion: string;
  descripcion: string;
  logo?: string;
  fechaCreacion: string;
  fechaModificacion: string;
  creadoPor: string;
  modificadoPor: string;
  activo: boolean;
}

export interface Documento {
  id: string;
  nombre: string;
  tipo: string;
  tamaño: number;
  url: string;
  fechaSubida: string;
  subidoPor: string;
}

export interface Nota {
  id: string;
  contenido: string;
  fechaCreacion: string;
  creadoPor: string;
  fechaModificacion?: string;
  modificadoPor?: string;
}

export interface CompleteCompany extends Company {
  documentos: Documento[];
  notas: Nota[];
}
