export enum ResponsibilityType {
  IMPUTABLE = "IMPUTABLE",
  SUPPORT = "SUPPORT",
  INFORMED = "INFORMED",
}

export interface ObjectiveRelation {
  relationId: string;
  positionId: string;
  type: ResponsibilityType;
}

export interface DeploymentMatrixResponse {
  positionId: string;
  positions: Array<{
    id: string;
    name: string;
  }>;
  objectives: Array<{
    id: string;
    name: string;
    // El backend puede enviar un Diccionario (Objeto) o un Arreglo
    relations: Record<string, ObjectiveRelation> | ObjectiveRelation[];
    myRelation: ResponsibilityType | null;
    isMine: boolean;
  }>;
}

export interface CollaborationItem {
  id: string;
  name: string;
  ownerPosition: {
    id: string;
    name: string;
  };
  myRelation: ResponsibilityType;
}
