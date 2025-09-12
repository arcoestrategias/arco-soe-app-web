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
} from "lucide-react";

export const navigationSections = [
  {
    title: "MANAGEMENT SYSTEM",
    items: [
      {
        title: "Resumen",
        url: "/resume",
        icon: LayoutGrid,
        module: "resume",
      },
      {
        title: "Plan Estratégico",
        url: "/strategic-plans",
        icon: Target,
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
      { title: "Usuarios", url: "/users", icon: Users2, module: "user" },
      {
        title: "Posiciones",
        url: "/positions/manage",
        icon: IdCardLanyard,
        module: "position",
      },
      {
        title: "Planes Estratégicos",
        url: "/strategic-plans/manage",
        icon: BookOpenCheck,
        module: "strategicPlan",
      },
    ],
  },
];
