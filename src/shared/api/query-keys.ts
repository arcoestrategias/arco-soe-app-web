export const QKEY = {
  companies: ["companies"] as const,
  logo: (id: string) => ["logo", id] as const,
  documents: (id: string) => ["documents", id] as const,

  businessUnits: ["business-units"] as const,
  buLogo: (id: string) => ["bu-logo", id] as const,
  buDocuments: (id: string) => ["bu-documents", id] as const,

  companyBusinessUnits: (companyId: string) =>
    ["business-units", "company", companyId] as const,

  businessUnitUsers: (businessUnitId: string) =>
    ["users", "by-business-unit", businessUnitId] as const,

  companyUsersGrouped: (companyId: string) =>
    ["users", "by-company", "grouped-by-business-unit", companyId] as const,

  users: ["users"] as const,
  userAvatar: (id: string) => ["user-avatar", id] as const,

  roles: ["roles"] as const,

  userPermissions: (businessUnitId: string, userId: string) =>
    ["user-permissions", businessUnitId, userId] as const,

  positions: ["positions"] as const,
  positionsByBU: (businessUnitId: string) =>
    ["positions", "bu", businessUnitId] as const,
  position: (positionId: string) => ["position", positionId] as const,

  positionsOverview: (
    businessUnitId: string,
    strategicPlanId: string,
    year: number | string,
    month: number | string,
    positionId?: string | null
  ) => [
    "positions",
    "overview",
    String(businessUnitId),
    String(strategicPlanId),
    String(year),
    String(month),
    String(positionId ?? "all"),
  ],

  positionsOrgChartOverview: (
    businessUnitId: string,
    strategicPlanId: string,
    year: number | string,
    month: number | string,
    positionId?: string | null
  ) =>
    [
      "positions",
      "org-chart-overview",
      String(businessUnitId),
      String(strategicPlanId),
      String(year),
      String(month),
      String(positionId ?? "all"),
    ] as const,

  companyPositionsGrouped: (companyId: string) =>
    ["positions", "by-company", "grouped-by-business-unit", companyId] as const,

  strategicPlans: ["strategic-plans"] as const,
  strategicPlan: (id: string) => ["strategic-plans", id] as const,
  strategicPlansByBU: (businessUnitId: string) =>
    ["strategic-plans", "bu", businessUnitId] as const,

  strategicSuccessFactors: (strategicPlanId: string) =>
    ["strategic-success-factors", strategicPlanId] as const,

  objectives: (planId: string, positionId: string, year?: number) =>
    ["objectives", planId, positionId, year ?? "all"] as const,

  strategyMapObjectives: (strategicPlanId: string) =>
    ["objectives", "strategy-map", strategicPlanId] as const,

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

  objectivesIcoBoard: (
    planId: string,
    positionId: string,
    fromYear: number | string,
    toYear: number | string
  ) =>
    [
      "objectives",
      "ico-board",
      String(planId),
      String(positionId),
      String(fromYear),
      String(toYear),
    ] as const,

  objectivesUnconfigured: (planId: string, positionId: string) => [
    "objectives-unconfigured",
    planId,
    positionId,
  ],

  objectiveConfigure: (objectiveId: string) =>
    ["objective", "configure", objectiveId] as const,

  comments: ["comments"] as const,
  commentsByReference: (referenceId: string) =>
    ["comments", "ref", referenceId] as const,

  notifications: "notifications",
  notificationsUnreadCount: "notifications.unreadCount",
};
