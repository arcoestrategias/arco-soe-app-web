export interface StrategicProjectStructureTask {
  id: string;
  name: string;
  description: string | null;
  order: number;
  fromAt: string | null;
  untilAt: string | null;
  finishedAt: string | null;
  status: string;
  props?: string | null;
  result?: string | null;
  methodology?: string | null;
  budget: number | string | null;
  limitation?: string | null;
  comments: string | null;
  projectFactorId: string;
  projectParticipantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface StrategicProjectStructureFactor {
  id: string;
  name: string;
  description: string | null;
  result: string | null;
  projectId: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  tasks: StrategicProjectStructureTask[];
  taskOpe: number;
  taskClo: number;
}

export interface StrategicProjectStructureParticipant {
  id: string;
  isLeader: boolean;
  projectId: string;
  positionId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  position: { id: string; name: string };
}

export interface StrategicProjectStructureProject {
  id: string;
  name: string;
  description: string | null;
  order: number;
  fromAt: string | null;
  untilAt: string | null;
  finishedAt: string | null;
  canceledAt: string | null;
  status: string;
  budget: number | string | null;
  strategicPlanId: string;
  positionId: string;
  objectiveId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  objective: { id: string; name: string } | null;
  position: { id: string; name: string };
  participants: StrategicProjectStructureParticipant[];
  factors: StrategicProjectStructureFactor[];
  leader?: StrategicProjectStructureParticipant;
  progressProject?: number | null;
}

export interface StrategicProjectStructureResponse {
  project: StrategicProjectStructureProject;
}
