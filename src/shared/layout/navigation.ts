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
} from "lucide-react";

export const navigationSections = [
  {
    title: "Main",
    items: [
      { title: "Resumen", url: "/resumen", icon: LayoutGrid },
      { title: "Plan Estratégico", url: "/strategic-plan", icon: Target },
      {
        title: "Proyectos Estratégicos",
        url: "/strategic-projects",
        icon: Briefcase,
      },
      { title: "Cargos", url: "/cargos", icon: Users },
      { title: "Objetivos", url: "/objetivos", icon: Trophy },
      { title: "Prioridades", url: "/prioridades", icon: Star },
      { title: "Performance", url: "/performance", icon: TrendingUp },
    ],
  },
  {
    title: "Gestión",
    items: [
      { title: "Compañías", url: "/companies", icon: Building2 },
      { title: "Unidades de Negocio", url: "/business-units", icon: Layers3 },
      { title: "Usuarios", url: "/users", icon: Users2 },
      { title: "Configuración", url: "/configuracion", icon: Settings },
    ],
  },
];
