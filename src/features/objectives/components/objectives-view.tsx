"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnnualIcoTrendCard from "./annual-ico-trend-card";
import { useObjectivesIcoBoard } from "../hooks/use-ico-board";
import { Card, CardContent } from "@/components/ui/card";
import IcoBoard from "./ico-board";
import ObjectivesCompliance from "./objectives-compliance";
import { DeploymentMatrix } from "./deployment-matrix";

import { QKEY } from "@/shared/api/query-keys";
import type { QueryKey } from "@tanstack/react-query";
import { useUpdateObjectiveGoal } from "@/features/objectives/hooks/use-objective-goals";
import { toast } from "sonner";
import { getHumanErrorMessage } from "@/shared/api/response";
import type { ObjectiveComplianceChange } from "./objective-compliance-modal";
import { useObjectives } from "@/features/strategic-plans/hooks/use-objectives";
import { NewObjectivePayload } from "./new-objective-modal";
import { useUnconfiguredObjectives } from "@/features/strategic-plans/hooks/use-unconfigured-objectives";
import { usePermissions } from "@/shared/auth/access-control";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";

type ObjectivesViewProps = {
  planId?: string;
  positionId?: string;
  year?: number | string;
};

export default function ObjectivesView({
  planId,
  positionId,
  year,
}: ObjectivesViewProps) {
  const { data, isLoading, error } = useObjectivesIcoBoard(
    planId,
    positionId,
    year,
  );

  const { items: unconfigured, isLoading: loadingUnconf } =
    useUnconfiguredObjectives(planId, positionId);

  const {
    showIcoBoardTab,
    showComplianceTab,
    showDeploymentMatrixTab,
    showAnnualIcoTrendChart,
  } = usePermissions({
    showIcoBoardTab: PERMISSIONS.OBJECTIVES.SHOW_ICO_BOARD_TAB,
    showComplianceTab: PERMISSIONS.OBJECTIVES.SHOW_COMPLIANCE_TAB,
    showDeploymentMatrixTab: PERMISSIONS.OBJECTIVES.SHOW_DEPLOYMENT_MATRIX_TAB,
    showAnnualIcoTrendChart: PERMISSIONS.OBJECTIVES.SHOW_ANNUAL_ICO_TREND_CHART,
  });

  const defaultTab = showIcoBoardTab
    ? "ico"
    : showComplianceTab
      ? "compliance"
      : showDeploymentMatrixTab
        ? "matrix"
        : undefined;

  const visibleTabsCount = [
    showIcoBoardTab,
    showComplianceTab,
    showDeploymentMatrixTab,
  ].filter(Boolean).length;

  // --- construir invalidateKeys con el mismo año (from = to = year) ---
  const canQuery = !!planId && !!positionId && !!year;
  const invalidateKeys: QueryKey[] = canQuery
    ? [
        QKEY.objectives(String(planId), String(positionId)),
        QKEY.objectivesIcoBoard(
          String(planId),
          String(positionId),
          String(year!),
          String(year!),
        ),
      ]
    : [];

  // --- hook de actualización ---
  const updateGoalMut = useUpdateObjectiveGoal(invalidateKeys);

  // --- handler que recibirá los "changes" desde la modal ---
  const handleComplianceUpdate = async (
    changes: ObjectiveComplianceChange[],
  ) => {
    const effective = changes.filter((c) => !!c.id);
    if (effective.length === 0) return;

    try {
      await Promise.all(
        effective.map((c) =>
          updateGoalMut.mutateAsync({
            id: c.id!, // id del registro mensual
            realValue: c.realValue, // puede venir sin cambios
            newGoalValue: c.newGoalValue, // meta ajustada
            baseValue: c.baseValue,
            observation: c.observation, // requerida si cambió la meta
          }),
        ),
      );
      toast.success("Cumplimiento actualizado");
    } catch (e) {
      toast.error(getHumanErrorMessage(e));
    }
  };

  const { createObjective: createObjectiveMut, isCreating } = useObjectives(
    planId,
    positionId,
  );

  // Handler que usará el modal del botón "+ Nuevo Objetivo"
  const handleCreateObjective = async (input: NewObjectivePayload) => {
    if (!planId || !positionId) return; // guard por filtros requeridos

    // 1) El "name" que espera tu backend lo tomamos de la oración compuesta
    const name = (input.objectiveText ?? "").trim();
    if (!name) return;

    const level = input.nivel;
    const indicatorName = input.indicador
      ? input.indicador.charAt(0).toUpperCase() +
        input.indicador.slice(1).toLowerCase()
      : "";

    // 2) Llamada al service (usa la mutation del hook para invalidar QKEY.objectives(planId, positionId))
    await createObjectiveMut({
      name,
      level,
      indicatorName,
      strategicPlanId: planId,
      positionId,
    });
  };

  if (!defaultTab) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {isLoading && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Cargando datos…
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-red-600">
            Ocurrió un error al cargar el tablero ICO.
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-${visibleTabsCount}`}>
          {showIcoBoardTab && (
            <TabsTrigger value="ico">Tablero ICO</TabsTrigger>
          )}
          {showComplianceTab && (
            <TabsTrigger value="compliance">Cumplimiento</TabsTrigger>
          )}
          {showDeploymentMatrixTab && (
            <TabsTrigger value="matrix">Matriz de Despliegue</TabsTrigger>
          )}
        </TabsList>

        {showIcoBoardTab && (
          <TabsContent value="ico" className="mt-4">
            <IcoBoard data={data} year={Number(year)} />
            {showAnnualIcoTrendChart && (
              <AnnualIcoTrendCard data={data} year={Number(year)} />
            )}
          </TabsContent>
        )}

        {showComplianceTab && (
          <TabsContent value="compliance" className="mt-4">
            <ObjectivesCompliance
              data={data}
              loading={isLoading}
              onComplianceUpdate={handleComplianceUpdate}
              onCreateObjective={handleCreateObjective}
              canCreateObjective={!!planId && !!positionId && !isCreating}
              unconfigured={unconfigured}
              loadingUnconfigured={loadingUnconf}
              strategicPlanId={planId!}
              positionId={positionId!}
              year={Number(year)}
            />
          </TabsContent>
        )}

        {showDeploymentMatrixTab && (
          <TabsContent value="matrix" className="mt-4">
            <DeploymentMatrix
              planId={planId}
              positionId={positionId}
              year={year}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
