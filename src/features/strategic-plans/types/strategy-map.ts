export interface StrategyMapObjective {
  id: string;
  name: string;
  perspective: "FIN" | "CLI" | "PRO" | "PER";
  objectiveParentId: string | null;
  goalStatus: {
    statusLabel: string;
    lightColorHex: string;
  };
  icoMonthly: Array<{
    ico: number;
    isMeasured: boolean;
    lightNumeric: number | null;
  }>;
}

export interface StrategyMapData {
  resume: {
    generalAverage: number;
    activeIndicators: number;
    lastActiveMonth: {
      month: number;
      year: number;
      label: string;
    };
  };
  listObjectives: Array<{ objective: StrategyMapObjective }>;
}

export interface StrategyMapApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: StrategyMapData;
}
