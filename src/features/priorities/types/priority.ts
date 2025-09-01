export type PriorityStatus = "OPE" | "CLO" | "CAN";

export interface Priority {
  id: string;
  name: string;
  description?: string | null;
  status: PriorityStatus;
  order: number;
  fromAt: string;
  untilAt: string;
  finishedAt?: string | null;
  canceledAt?: string | null;
  month?: number;
  year?: number;
  isActive: boolean;
  positionId: string;
  objectiveId?: string | null;
  objectiveName?: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  monthlyClass?: string;
  compliance?: "0%" | "100%" | "-";
}

export interface CreatePriorityDto {
  name: string;
  description?: string;
  status?: PriorityStatus;
  fromAt: string;
  untilAt: string;
  positionId: string;
  objectiveId?: string;
  finishedAt?: string;
}

export interface UpdatePriorityDto {
  name?: string;
  description?: string;
  status?: PriorityStatus;
  fromAt?: string;
  untilAt?: string;
  positionId?: string;
  objectiveId?: string;
  finishedAt?: string;
}

export interface ToggleActivePriorityDto {
  isActive: boolean;
}

export interface FilterPriorityDto {
  positionId?: string;
  objectiveId?: string;
  status?: PriorityStatus;
  monthlyClass?: string;
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
}

export interface PrioritiesListData {
  items: Priority[];
  total: number;
  page: number;
  limit: number;
  icp?: {
    month: number;
    year: number;
    positionId: string;
    totalPlanned: number;
    totalCompleted: number;
    icp: number;
    notCompletedPreviousMonths: number;
    notCompletedOverdue: number;
    inProgress: number;
    completedPreviousMonths: number;
    completedLate: number;
    completedInOtherMonth: number;
    completedOnTime: number;
    canceled: number;
    completedEarly: number;
  };
}

export type PriorityIcpSeriesItem = {
  month: number;
  year: number;
  icp: number;
  totalPlanned: number;
  totalCompleted: number;
  inProgress: number;
  notCompletedOverdue: number;
  notCompletedPreviousMonths: number;
  completedOnTime: number;
  completedLate: number;
  completedPreviousMonths: number;
  completedInOtherMonth: number;
  canceled: number;
  completedEarly: number;
};

export type PriorityIcpSeries = {
  positionId: string;
  from: string; // "YYYY-MM"
  to: string; // "YYYY-MM"
  items: PriorityIcpSeriesItem[];
};
