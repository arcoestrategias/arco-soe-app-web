import {
  LayoutGrid,
  Target,
  Briefcase,
  Users,
  Trophy,
  Star,
  TrendingUp,
  Settings,
  Building2,
  Layers3,
  Users2,
  BookOpenCheck,
  IdCardLanyard,
  Shield,
  UserCog2,
} from "lucide-react";

export const navigationSections = [
  {
    title: "MANAGEMENT SYSTEM",
    items: [
      {
        title: "Performance",
        url: "/resume",
        icon: LayoutGrid,
        module: "resume",
      },
      {
        title: "Plan Estratégico",
        url: "/strategic-plans",
        icon: BookOpenCheck,
        module: "strategicPlan",
      },
      {
        title: "Posiciones",
        url: "/positions",
        icon: Users,
        module: "position",
      },
      {
        title: "Proyectos Estratégicos",
        url: "/strategic-projects",
        icon: Briefcase,
        module: "strategicProject",
      },

      {
        title: "Objetivos",
        url: "/objectives",
        icon: Target,
        module: "objective",
      },
      {
        title: "Prioridades",
        url: "/priorities",
        icon: Star,
        module: "priority",
      },
      // {
      //   title: "Performance",
      //   url: "/performance",
      //   icon: TrendingUp,
      //   module: "performance",
      // },
    ],
  },
  {
    title: "CONFIGURACIONES",
    items: [
      {
        title: "Compañías",
        url: "/companies",
        icon: Building2,
        module: "company",
      },
      {
        title: "Unidades de Negocio",
        url: "/business-units",
        icon: Layers3,
        module: "businessUnit",
      },
      { title: "Usuarios", url: "/users", icon: UserCog2, module: "user" },
      {
        title: "Posiciones",
        url: "/positions/manage",
        icon: Users2,
        module: "positionManagement",
      },
      {
        title: "Planes Estratégicos",
        url: "/strategic-plans/manage",
        icon: BookOpenCheck,
        module: "strategicPlanManagement",
      },
      {
        title: "Módulos",
        url: "/modules",
        icon: Settings,
        module: "module",
      },
      {
        title: "Roles",
        url: "/roles",
        icon: Shield,
        module: "role",
      },
    ],
  },
];
