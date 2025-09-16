"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnnualIcoTrendCard from "./annual-ico-trend-card";
import { DeploymentMatrix } from "./deployment-matrix";
import { useObjectivesIcoBoard } from "../hooks/use-ico-board";
import { Card, CardContent } from "@/components/ui/card";
import IcoBoard from "./ico-board";
import ObjectivesCompliance from "./objectives-compliance";

import { QKEY } from "@/shared/api/query-keys";
import type { QueryKey } from "@tanstack/react-query";
import { useUpdateObjectiveGoal } from "@/features/objectives/hooks/use-objective-goals";
import { toast } from "sonner";
import { getHumanErrorMessage } from "@/shared/api/response";
import type { ObjectiveComplianceChange } from "./objective-compliance-modal";

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
    year
  );

  // --- construir invalidateKeys con el mismo año (from = to = year) ---
  const canQuery = !!planId && !!positionId && !!year;
  const invalidateKeys: QueryKey[] = canQuery
    ? [
        QKEY.objectives(String(planId), String(positionId)),
        QKEY.objectivesIcoBoard(
          String(planId),
          String(positionId),
          String(year!),
          String(year!)
        ),
      ]
    : [];

  // --- hook de actualización ---
  const updateGoalMut = useUpdateObjectiveGoal(invalidateKeys);

  // --- handler que recibirá los "changes" desde la modal ---
  const handleComplianceUpdate = async (
    changes: ObjectiveComplianceChange[]
  ) => {
    const effective = changes.filter((c) => !!c.id);
    if (effective.length === 0) return;

    try {
      await Promise.all(
        effective.map((c) =>
          updateGoalMut.mutateAsync({ id: c.id!, realValue: c.realValue })
        )
      );
      toast.success("Cumplimiento actualizado");
    } catch (e) {
      toast.error(getHumanErrorMessage(e));
    }
  };

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

      <Tabs defaultValue="ico" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ico">Tablero ICO</TabsTrigger>
          <TabsTrigger value="compliance">Cumplimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="ico" className="mt-4">
          <IcoBoard data={data} year={Number(year)} />
          <AnnualIcoTrendCard data={data} year={Number(year)} />
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <ObjectivesCompliance
            data={data}
            loading={isLoading}
            onComplianceUpdate={handleComplianceUpdate} // <- pasar handler
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
