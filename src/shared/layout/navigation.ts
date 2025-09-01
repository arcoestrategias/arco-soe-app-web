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
    title: "Main",
    items: [
      { title: "Resumen", url: "/resumen", icon: LayoutGrid },
      { title: "Plan Estratégico", url: "/strategic-plans", icon: Target },
      { title: "Posiciones", url: "/positions", icon: Users },
      {
        title: "Proyectos Estratégicos",
        url: "/strategic-projects",
        icon: Briefcase,
      },

      { title: "Objetivos", url: "/objetivos", icon: Trophy },
      { title: "Prioridades", url: "/priorities", icon: Star },
      { title: "Performance", url: "/performance", icon: TrendingUp },
    ],
  },
  {
    title: "Gestión",
    items: [
      { title: "Compañías", url: "/companies", icon: Building2 },
      { title: "Unidades de Negocio", url: "/business-units", icon: Layers3 },
      { title: "Usuarios", url: "/users", icon: Users2 },
      { title: "Posiciones", url: "/positions/manage", icon: IdCardLanyard },
      {
        title: "Planes Estrategicos",
        url: "/strategic-plans/manage",
        icon: BookOpenCheck,
      },
      { title: "Configuración", url: "/configuracion", icon: Settings },
    ],
  },
];
