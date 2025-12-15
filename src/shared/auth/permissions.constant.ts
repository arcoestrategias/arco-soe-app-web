const buildPermissions = (shortCode: string) => ({
  ACCESS: `${shortCode}.access`,
  READ: `${shortCode}.read`,
  CREATE: `${shortCode}.create`,
  UPDATE: `${shortCode}.update`,
  DELETE: `${shortCode}.delete`,
  REORDER: `${shortCode}.reorder`,
  EXPORT: `${shortCode}.export`,
  COMPLIANCE: `${shortCode}.compliance`,
  NOTES: `${shortCode}.notes`,
  DOCUMENTS: `${shortCode}.documents`,
  MANAGEMENT: `${shortCode}.management`,
  AUDIT: `${shortCode}.audit`,
  APPROVE: `${shortCode}.approve`,
  ASSIGN: `${shortCode}.assign`,
  VIEW_ICP: `${shortCode}.viewIcp`,
  VIEW_ICO: `${shortCode}.viewIco`,
  VIEW_PROJECT_PROGRESS: `${shortCode}.viewProjectProgress`,
  CONFIGURE_PERMISSIONS: `${shortCode}.configurePermissions`,
  VIEW_MAP: `${shortCode}.viewMap`,
});

export const PERMISSIONS = {
  USERS: buildPermissions("user"),
  ROLES: buildPermissions("role"),
  PERMISSIONS: buildPermissions("permission"),
  MODULES: buildPermissions("module"),
  COMPANIES: buildPermissions("company"),
  BUSINESS_UNITS: buildPermissions("businessUnit"),
  POSITIONS: buildPermissions("position"),
  STRATEGIC_PLANS: buildPermissions("strategicPlan"),
  STRATEGIC_VALUES: buildPermissions("strategicValue"),
  STRATEGIC_SUCCESS_FACTORS: buildPermissions("strategicSuccessFactor"),
  OBJECTIVES: buildPermissions("objective"),
  INDICATORS: buildPermissions("indicator"),
  OBJECTIVE_GOALS: buildPermissions("objectiveGoal"),
  OBJECTIVES_PARTICIPANTS: buildPermissions("objectiveParticipant"),
  STRATEGIC_PROJECTS: buildPermissions("strategicProject"),
  PROJECT_PARTICIPANTS: buildPermissions("projectParticipant"),
  PROJECT_FACTORS: buildPermissions("projectFactor"),
  PROJECT_TASKS: buildPermissions("projectTask"),
  LEVERS: buildPermissions("lever"),
  PRIORITIES: buildPermissions("priority"),
  PERFORMANCE: buildPermissions("performance"),
  COMMENTS: buildPermissions("comment"),
  NOTIFICATIONS: buildPermissions("notification"),
  MEETINGS: buildPermissions("meeting"),
  FILTERS: {
    STRATEGIC_PLAN: "filter.strategicPlan",
    POSITION: "filter.position",
    MONTH: "filter.month",
    YEAR: "filter.year",
  },
} as const;

// Mantenemos STANDARD_ACTIONS para casos donde necesitemos iterar sobre todas las acciones posibles.
export const STANDARD_ACTIONS = Object.keys(buildPermissions("any")).map(
  (key) =>
    key
      .replace(/([A-Z])/g, "_$1")
      .toLowerCase()
      .substring(1)
) as Array<keyof ReturnType<typeof buildPermissions>>;
