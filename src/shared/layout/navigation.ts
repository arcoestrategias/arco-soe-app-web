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
  Calendar,
} from "lucide-react";

export const navigationSections = [
  {
    title: "MANAGEMENT SYSTEM",
    items: [
      {
        title: "Performance",
        url: "/resume",
        icon: LayoutGrid,
        module: "performance",
      },
      {
        title: "Plan Estratégico",
        url: "/strategic-plans",
        icon: BookOpenCheck,
        module: "strategicPlans",
      },
      {
        title: "Posiciones",
        url: "/positions",
        icon: Users,
        module: "positions",
      },
      {
        title: "Proyectos Estratégicos",
        url: "/strategic-projects",
        icon: Briefcase,
        module: "strategicProjects",
      },

      {
        title: "Objetivos",
        url: "/objectives",
        icon: Target,
        module: "objectives",
      },
      {
        title: "Prioridades",
        url: "/priorities",
        icon: Star,
        module: "priorities",
      },
      {
        title: "Reuniones",
        url: "/meetings",
        icon: Calendar,
        module: "meeting",
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
        module: "companies",
        action: "menuConfig",
      },
      {
        title: "Unidades de Negocio",
        url: "/business-units",
        icon: Layers3,
        module: "businessUnits",
        action: "menuConfig",
      },
      {
        title: "Usuarios",
        url: "/users",
        icon: UserCog2,
        module: "users",
        action: "menuConfig",
      },
      {
        title: "Posiciones",
        url: "/positions/manage",
        icon: Users2,
        module: "positions",
        action: "menuConfig",
      },
      {
        title: "Planes Estratégicos",
        url: "/strategic-plans/manage",
        icon: BookOpenCheck,
        module: "strategicPlans",
        action: "menuConfig",
      },
      {
        title: "Módulos",
        url: "/modules",
        icon: Settings,
        module: "modules",
        action: "menuConfig",
      },
      {
        title: "Roles",
        url: "/roles",
        icon: Shield,
        module: "roles",
        action: "menuConfig",
      },
    ],
  },
];
