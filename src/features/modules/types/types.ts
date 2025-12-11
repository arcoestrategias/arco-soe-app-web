export interface Module {
  id: string;
  name: string;
  shortCode: string;
  description: string | null;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  moduleId: string;
  isActive?: boolean;
}
