// import { PERMISSIONS } from "../auth/permissions.constant";

// export const MANAGEMENT_SYSTEM_UI_CONFIG = {
//   performance: {
//     module: "performance",
//     menuAccessPermission: PERMISSIONS.PERFORMANCE.ACCESS,
//     filters: [
//       { key: "strategicPlan", permission: PERMISSIONS.FILTERS.STRATEGIC_PLAN },
//       { key: "position", permission: PERMISSIONS.FILTERS.POSITION },
//       { key: "month", permission: PERMISSIONS.FILTERS.MONTH },
//       { key: "year", permission: PERMISSIONS.FILTERS.YEAR },
//     ],
//     actions: {
//       READ_PANEL: PERMISSIONS.PERFORMANCE.READ,
//       VIEW_ICO: PERMISSIONS.PERFORMANCE.VIEW_ICO,
//       VIEW_ICP: PERMISSIONS.PERFORMANCE.VIEW_ICP,
//     },
//   },
//   strategicPlans: {
//     module: "strategicPlan",
//     menuAccessPermission: PERMISSIONS.STRATEGIC_PLANS.ACCESS,
//     filters: [
//       { key: "strategicPlan", permission: PERMISSIONS.FILTERS.STRATEGIC_PLAN },
//     ],
//     tabs: [
//       {
//         key: "definition",
//         label: "Definición",
//         permission: PERMISSIONS.STRATEGIC_PLANS.READ,
//         actions: {
//           UPDATE_PLAN: PERMISSIONS.STRATEGIC_PLANS.UPDATE,
//           EXPORT_REPORT: PERMISSIONS.STRATEGIC_PLANS.EXPORT,
//         },
//         cards: {
//           successFactors: {
//             module: "strategicSuccessFactor",
//             permissions: PERMISSIONS.STRATEGIC_SUCCESS_FACTORS,
//           },
//           values: {
//             module: "strategicValue",
//             permissions: PERMISSIONS.STRATEGIC_VALUES,
//           },
//           objectives: {
//             module: "objective",
//             permissions: PERMISSIONS.OBJECTIVES,
//           },
//           projects: {
//             module: "strategicProject",
//             permissions: PERMISSIONS.STRATEGIC_PROJECTS,
//           },
//         },
//       },
//       {
//         key: "strategyMap",
//         label: "Mapa Estratégico",
//         permission: PERMISSIONS.STRATEGIC_PLANS.VIEW_MAP,
//         actions: {},
//       },
//     ],
//   },
//   positions: {
//     module: "position",
//     menuAccessPermission: PERMISSIONS.POSITIONS.ACCESS,
//     filters: [
//       { key: "strategicPlan", permission: PERMISSIONS.FILTERS.STRATEGIC_PLAN },
//       { key: "position", permission: PERMISSIONS.FILTERS.POSITION },
//       { key: "month", permission: PERMISSIONS.FILTERS.MONTH },
//       { key: "year", permission: PERMISSIONS.FILTERS.YEAR },
//     ],
//     tabs: [
//       {
//         key: "definition",
//         label: "Definición",
//         permission: PERMISSIONS.POSITIONS.READ,
//         actions: {
//           UPDATE_POSITION: PERMISSIONS.POSITIONS.UPDATE,
//         },
//         cards: {
//           objectives: {
//             module: "objective",
//             permissions: PERMISSIONS.OBJECTIVES,
//           },
//           projects: {
//             module: "strategicProject",
//             permissions: PERMISSIONS.STRATEGIC_PROJECTS,
//           },
//           levers: {
//             module: "lever",
//             permissions: PERMISSIONS.LEVERS,
//           },
//         },
//       },
//       {
//         key: "orgChart",
//         label: "Organigrama",
//         permission: PERMISSIONS.POSITIONS.READ,
//         actions: {},
//       },
//     ],
//   },
//   strategicProjects: {
//     module: "strategicProject",
//     menuAccessPermission: PERMISSIONS.STRATEGIC_PROJECTS.ACCESS,
//     filters: [
//       { key: "strategicPlan", permission: PERMISSIONS.FILTERS.STRATEGIC_PLAN },
//       { key: "position", permission: PERMISSIONS.FILTERS.POSITION },
//     ],
//     actions: {
//       CREATE_PROJECT: PERMISSIONS.STRATEGIC_PROJECTS.CREATE,
//       UPDATE_PROJECT: PERMISSIONS.STRATEGIC_PROJECTS.UPDATE,
//       EXPORT_REPORT: PERMISSIONS.STRATEGIC_PROJECTS.EXPORT,
//       OPEN_FACTORS_MODAL: PERMISSIONS.STRATEGIC_PROJECTS.MANAGEMENT,
//     },
//     modalActions: {
//       factors: {
//         CREATE: PERMISSIONS.PROJECT_FACTORS.CREATE,
//         UPDATE: PERMISSIONS.PROJECT_FACTORS.UPDATE,
//         REORDER: PERMISSIONS.PROJECT_FACTORS.REORDER,
//       },
//       tasks: {
//         CREATE: PERMISSIONS.PROJECT_TASKS.CREATE,
//         UPDATE: PERMISSIONS.PROJECT_TASKS.UPDATE,
//         DELETE: PERMISSIONS.PROJECT_TASKS.DELETE,
//         REORDER: PERMISSIONS.PROJECT_TASKS.REORDER,
//       },
//     },
//   },
//   objectives: {
//     module: "objective",
//     menuAccessPermission: PERMISSIONS.OBJECTIVES.ACCESS,
//     filters: [
//       { key: "strategicPlan", permission: PERMISSIONS.FILTERS.STRATEGIC_PLAN },
//       { key: "position", permission: PERMISSIONS.FILTERS.POSITION },
//       { key: "year", permission: PERMISSIONS.FILTERS.YEAR },
//     ],
//     tabs: [
//       {
//         key: "icoDashboard",
//         label: "Tablero ICO",
//         permission: PERMISSIONS.OBJECTIVES.VIEW_ICO,
//         fallbackPermission: PERMISSIONS.OBJECTIVES.READ, // Opcional
//         actions: {},
//       },
//       {
//         key: "compliance",
//         label: "Cumplimiento",
//         permission: PERMISSIONS.OBJECTIVES.READ,
//         actions: {
//           CREATE: PERMISSIONS.OBJECTIVES.CREATE,
//           LOG_COMPLIANCE: PERMISSIONS.OBJECTIVES.COMPLIANCE,
//           UPDATE_EXPECTED_VALUE: PERMISSIONS.OBJECTIVES.UPDATE,
//           ADD_NOTES: PERMISSIONS.OBJECTIVES.NOTES,
//           ADD_DOCUMENTS: PERMISSIONS.OBJECTIVES.DOCUMENTS,
//           CONFIGURE: PERMISSIONS.OBJECTIVES.MANAGEMENT,
//           DELETE: PERMISSIONS.OBJECTIVES.DELETE,
//         },
//       },
//     ],
//   },
//   priorities: {
//     module: "priority",
//     menuAccessPermission: PERMISSIONS.PRIORITIES.ACCESS,
//     filters: [
//       { key: "strategicPlan", permission: PERMISSIONS.FILTERS.STRATEGIC_PLAN },
//       { key: "position", permission: PERMISSIONS.FILTERS.POSITION },
//       { key: "month", permission: PERMISSIONS.FILTERS.MONTH },
//       { key: "year", permission: PERMISSIONS.FILTERS.YEAR },
//     ],
//     actions: {
//       READ_CHARTS: PERMISSIONS.PRIORITIES.READ,
//       UPDATE_STATUS: PERMISSIONS.PRIORITIES.UPDATE,
//       UPDATE_DATES: PERMISSIONS.PRIORITIES.UPDATE,
//       UPDATE_PRIORITY: PERMISSIONS.PRIORITIES.UPDATE,
//       ADD_NOTES: PERMISSIONS.PRIORITIES.NOTES,
//       ADD_DOCUMENTS: PERMISSIONS.PRIORITIES.DOCUMENTS,
//       DELETE: PERMISSIONS.PRIORITIES.DELETE,
//     },
//   },
//   meetings: {
//     module: "meeting",
//     menuAccessPermission: PERMISSIONS.MEETINGS.ACCESS,
//     actions: {
//       READ: PERMISSIONS.MEETINGS.READ,
//       CREATE: PERMISSIONS.MEETINGS.CREATE,
//       UPDATE: PERMISSIONS.MEETINGS.UPDATE,
//       DELETE: PERMISSIONS.MEETINGS.DELETE,
//       EXECUTE: PERMISSIONS.MEETINGS.UPDATE,
//     },
//   },
// } as const;
