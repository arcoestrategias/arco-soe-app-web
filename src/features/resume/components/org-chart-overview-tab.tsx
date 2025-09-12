// "use client";

// import * as React from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { useOrgChartOverview } from "../hooks/use-org-chart-overview";
// import { OrganizationChartOverview } from "./organization-chart-overview";

// type Props = {
//   companyId?: string;
//   businessUnitId?: string;
//   strategicPlanId?: string | null;
//   month: number;
//   year: number;
// };

// export default function OrgChartOverviewTab({
//   companyId,
//   businessUnitId,
//   strategicPlanId,
//   month,
//   year,
// }: Props) {
//   const enabled =
//     !!companyId && !!businessUnitId && !!strategicPlanId && !!month && !!year;

//   const { data, isLoading, error } = useOrgChartOverview(
//     companyId!,
//     businessUnitId!,
//     strategicPlanId!,
//     month,
//     year
//   );

//   if (isLoading) {
//     return (
//       <Card>
//         <CardContent className="py-8 text-center text-sm text-muted-foreground">
//           Cargando organigrama…
//         </CardContent>
//       </Card>
//     );
//   }

//   if (error) {
//     return (
//       <Card>
//         <CardContent className="py-8 text-center text-sm text-red-600">
//           Ocurrió un error al cargar el organigrama.
//         </CardContent>
//       </Card>
//     );
//   }

//   const root = data?.data?.root; // usa tal cual la estructura del API

//   if (!root) {
//     return (
//       <Card>
//         <CardContent className="py-8 text-center text-sm text-muted-foreground">
//           No hay datos para los filtros seleccionados.
//         </CardContent>
//       </Card>
//     );
//   }

//   return <OrganizationChartOverview data={root} />;
// }
