// Versión de API centralizada
export const API_PREFIX = "/api/v1" as const;

// Sanitiza y une segmentos sin duplicar slashes
const join = (...parts: Array<string | number | undefined | null>) => {
  const raw = parts
    .filter((p): p is string | number => p !== undefined && p !== null)
    .map(String)
    .join("/");

  // Normaliza: un solo slash, y siempre empieza con "/"
  return ("/" + raw).replace(/\/{2,}/g, "/");
};

// Aplica el prefijo a una ruta relativa
const prefixed = (...parts: Array<string | number | undefined | null>) =>
  join(API_PREFIX, ...parts);

// Builder opcional de querystring
export const qs = (
  params?: Record<string, string | number | boolean | undefined | null>
) => {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null
  );
  if (!entries.length) return "";
  const search = new URLSearchParams();
  for (const [k, v] of entries) search.set(k, String(v));
  return `?${search.toString()}`;
};

// Módulos conocidos (literal-friendly)
export const Modules = {
  AUTH: "auth",
  ROLES: "roles",
  COMPANIES: "companies",
  BUSINESS_UNITS: "business-units",
  USERS: "users",
  POSITIONS: "positions",
  STRATEGIC_PLANS: "strategic-plans",
  STRATEGIC_SUCCESS_FACTORS: "strategic-success-factors",
  OBJECTIVES: "objectives",
  STRATEGIC_PROJECTS: "strategic-projects",
  STRATEGIC_VALUES: "strategic-values",
  LEVERS: "levers",
  OBJECTIVE_GOALS: "objective-goals",

  PRIORITIES: "priorities",
  FILES: "files",
  // agrega aquí más módulos a futuro…
} as const;

// Rutas agrupadas
export const routes = {
  auth: {
    base: () => prefixed(Modules.AUTH),
    login: () => prefixed(Modules.AUTH, "login"),
    logout: () => prefixed(Modules.AUTH, "logout"),
    refresh: () => prefixed(Modules.AUTH, "refresh"),
    confirm: () => prefixed(Modules.AUTH, "confirm"),
    forgotPassword: () => prefixed(Modules.AUTH, "forgot-password"),
    resetPassword: () => prefixed(Modules.AUTH, "reset-password"),
    sendConfirmationEmail: (id: string) =>
      prefixed(Modules.USERS, id, "send-confirmation-email"),
  },

  roles: {
    list: () => prefixed(Modules.ROLES),
  },

  companies: {
    base: () => prefixed(Modules.COMPANIES),
    list: () => prefixed(Modules.COMPANIES),
    byId: (id: string) => prefixed(Modules.COMPANIES, id),
    create: () => prefixed(Modules.COMPANIES),
    update: (id: string) => prefixed(Modules.COMPANIES, id),
    remove: (id: string) => prefixed(Modules.COMPANIES, id),
    fullCreate: () => prefixed(Modules.COMPANIES, "full-create"),
  },

  businessUnits: {
    base: () => prefixed(Modules.BUSINESS_UNITS),
    list: () => prefixed(Modules.BUSINESS_UNITS),
    byId: (id: string) => prefixed(Modules.BUSINESS_UNITS, id),
    create: () => prefixed(Modules.BUSINESS_UNITS),
    update: (id: string) => prefixed(Modules.BUSINESS_UNITS, id),
    remove: (id: string) => prefixed(Modules.BUSINESS_UNITS, id),
    userPermissions: (businessUnitId: string, userId: string) =>
      prefixed(
        Modules.BUSINESS_UNITS,
        businessUnitId,
        "users",
        userId,
        "permissions"
      ),
    users: (businessUnitId: string) =>
      `/api/v1/business-units/${businessUnitId}/users`,
  },

  users: {
    base: () => prefixed(Modules.USERS),
    me: () => prefixed(Modules.USERS, "me"),
    list: () => prefixed(Modules.USERS),
    listByBusinessUnit: (businessUnitId: string) =>
      prefixed(Modules.USERS, `/business-unit/${businessUnitId}`),
    listByCompanyGrouped: (companyId: string) =>
      prefixed("users", "company", companyId, "group-by-business-unit"),
    create: () => prefixed(Modules.USERS),
    update: (id: string) => prefixed(Modules.USERS, id),
    assign: () => prefixed(`${Modules.USERS}/create-user-with-role-business`),
    assignToBusinessUnit: () =>
      prefixed(`${Modules.USERS}/assign-to-business-unit`),
    patchUserBusinessUnit: (userId: string, businessUnitId: string) =>
      prefixed(Modules.USERS, userId, "business-units", businessUnitId),
  },

  positions: {
    list: () => prefixed(Modules.POSITIONS),
    listByCompanyGrouped: (companyId: string) =>
      prefixed("positions", "company", companyId, "group-by-business-unit"),
    byId: (positionId: string) => prefixed(Modules.POSITIONS, positionId),
    create: () => prefixed(Modules.POSITIONS),
    update: (positionId: string) => prefixed(Modules.POSITIONS, positionId),
    overview: () => prefixed(Modules.POSITIONS, "overview"),
    orgChartOverview: () => prefixed(Modules.POSITIONS, "org-chart-overview"),
  },

  strategicPlans: {
    list: () => prefixed(Modules.STRATEGIC_PLANS),
    create: () => prefixed(Modules.STRATEGIC_PLANS),
    update: (strategicPlanId: string) =>
      prefixed(Modules.STRATEGIC_PLANS, strategicPlanId),
    show: (strategicPlanId: string) =>
      prefixed(Modules.STRATEGIC_PLANS, strategicPlanId),
  },

  strategicSuccessFactors: {
    index: () => prefixed(Modules.STRATEGIC_SUCCESS_FACTORS),
    create: () => prefixed(Modules.STRATEGIC_SUCCESS_FACTORS),
    update: (strategicSuccessFactorId: string) =>
      prefixed(Modules.STRATEGIC_SUCCESS_FACTORS, strategicSuccessFactorId),
    reorder: () => prefixed(Modules.STRATEGIC_SUCCESS_FACTORS, "reorder"),
  },

  objectives: {
    listByPlan: () => prefixed(Modules.OBJECTIVES),
    create: () => prefixed(Modules.OBJECTIVES),
    update: (objectiveId: string) => prefixed(Modules.OBJECTIVES, objectiveId),
    reorder: () => prefixed(Modules.OBJECTIVES, "reorder"),
    icoBoard: () => prefixed("ico", "objectives", "ico-board"),
    unconfigured: () => prefixed(Modules.OBJECTIVES, "unconfigured"),
    configure: (objectiveId: string) =>
      prefixed(Modules.OBJECTIVES, objectiveId, "configure"),
  },

  strategicProjects: {
    listByPlanPosition: () => prefixed(Modules.STRATEGIC_PROJECTS),
    structure: (strategicPlanId: string, positionId: string) =>
      `/api/v1/strategic-projects/structure?strategicPlanId=${strategicPlanId}&positionId=${positionId}`,
    dashboard: (strategicPlanId: string, positionId: string) =>
      `/api/v1/strategic-projects/dashboard?strategicPlanId=${strategicPlanId}&positionId=${positionId}`,
    structureByProjectId: (projectId: string) =>
      `/api/v1/strategic-projects/${projectId}/structure`,
    create: `/api/v1/strategic-projects`,
    update: (strategicProjectId: string) =>
      `/api/v1/strategic-projects/${strategicProjectId}`,
    setActive: (strategicProjectId: string) =>
      `/api/v1/strategic-projects/${strategicProjectId}/active`,
    reorder: `/api/v1/strategic-projects/reorder`,
  },

  projectFactors: {
    create: () => prefixed("project-factors"),
    update: (id: string) => prefixed("project-factors", id),
    setActive: (id: string) => prefixed("project-factors", id, "active"),
    reorder: () => prefixed("project-factors", "reorder"),
  },
  projectTasks: {
    create: () => prefixed("project-tasks"),
    update: (id: string) => prefixed("project-tasks", id),
    setActive: (id: string) => prefixed("project-tasks", id, "active"),
    reorder: () => prefixed("project-tasks", "reorder"),
  },

  strategicValues: {
    listByPlan: () => prefixed(Modules.STRATEGIC_VALUES),
    create: () => `/api/v1/strategic-values`,
    update: (strategicValueId: string) =>
      `/api/v1/strategic-values/${strategicValueId}`,
    reorder: `/api/v1/strategic-values/reorder`,
  },

  levers: {
    list: () => prefixed(Modules.LEVERS),
    create: () => prefixed(Modules.LEVERS),
    update: (leverId: string) => prefixed(Modules.LEVERS, leverId),
    reorder: () => prefixed(Modules.LEVERS, "reorder"),
  },

  priorities: {
    base: "/api/v1/priorities",
    list: () => "/api/v1/priorities",
    create: () => "/api/v1/priorities",
    update: (id: string) => `/api/v1/priorities/${id}`,
    toggleActive: (id: string) => `/api/v1/priorities/${id}/active`,
    icpSeries: "/api/v1/priorities/icp/series",
  },

  objectiveGoals: {
    update: (goalId: string) => prefixed(Modules.OBJECTIVE_GOALS, goalId),
  },

  files: {
    base: () => prefixed(Modules.FILES),
    byQuery: (params: { type: "logo" | "document"; referenceId: string }) =>
      prefixed(Modules.FILES) + qs(params),

    list: (params: { type: "logo" | "document"; referenceId: string }) =>
      prefixed(Modules.FILES) + qs(params),
    upload: (params: { type: "logo" | "document"; referenceId: string }) =>
      prefixed(Modules.FILES) + qs(params),
  },

  notifications: {
    send: () => prefixed("/notifications/send"),
  },
} as const;

// Helper opcional para crear módulos dinámicos
export const buildModule = (moduleName: string) => ({
  base: () => prefixed(moduleName),
  byId: (id: string) => prefixed(moduleName, id),
});
