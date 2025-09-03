export const QKEY = {
  companies: ["companies"] as const,
  logo: (id: string) => ["logo", id] as const,
  documents: (id: string) => ["documents", id] as const,

  businessUnits: ["business-units"] as const,
  buLogo: (id: string) => ["bu-logo", id] as const,
  buDocuments: (id: string) => ["bu-documents", id] as const,

  businessUnitUsers: (businessUnitId: string) =>
    ["business-unit", "users", businessUnitId] as const,

  users: ["users"] as const,
  userAvatar: (id: string) => ["user-avatar", id] as const,

  roles: ["roles"] as const,

  userPermissions: (businessUnitId: string, userId: string) =>
    ["user-permissions", businessUnitId, userId] as const,

  positions: ["positions"] as const,
  positionsByBU: (businessUnitId: string) =>
    ["positions", "bu", businessUnitId] as const,
  position: (positionId: string) => ["position", positionId] as const,

  strategicPlans: ["strategic-plans"] as const,
  strategicPlan: (id: string) => ["strategic-plans", id] as const,
  strategicPlansByBU: (businessUnitId: string) =>
    ["strategic-plans", "bu", businessUnitId] as const,

  strategicSuccessFactors: (strategicPlanId: string) =>
    ["strategic-success-factors", strategicPlanId] as const,

  objectives: (strategicPlanId: string, positionId: string) =>
    ["objectives", strategicPlanId, positionId] as const,

  strategicProjects: (strategicPlanId: string, positionId: string) =>
    ["strategic-projects", "structure", strategicPlanId, positionId] as const,

  strategicValues: (strategicPlanId: string) =>
    ["strategic-values", strategicPlanId] as const,

  levers: (positionId: string) => ["levers", positionId] as const,

  strategicProjectsDashboard: (planId: string, positionId: string) =>
    ["strategic-projects", "dashboard", planId, positionId] as const,

  strategicProjectStructure: (projectId: string) =>
    ["strategic-projects", "structure", projectId] as const,

  priorities: ["priorities"] as const,

  prioritiesByPMY: (
    positionId: string,
    month: number,
    year: number,
    page: number = 1,
    limit: number = 1000,
    status?: "OPE" | "CLO" | "CAN",
    objectiveId?: string,
    monthlyClass?: string
  ) =>
    [
      "priorities",
      positionId,
      month,
      year,
      page,
      limit,
      status ?? "any",
      objectiveId ?? "any",
      monthlyClass ?? "any",
    ] as const,

  prioritiesIcpSeries(positionId: string, from: string, to: string) {
    return ["priorities", "icp-series", positionId, from, to] as const;
  },
};
