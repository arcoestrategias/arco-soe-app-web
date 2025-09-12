"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnnualIcoTrendCard from "./annual-ico-trend-card";
import { ObjectivesCompliance } from "./objectives-compliance";
import { DeploymentMatrix } from "./deployment-matrix";
import { useObjectivesIcoBoard } from "../hooks/use-ico-board";
import { Card, CardContent } from "@/components/ui/card";
import IcoBoard from "./ico-board";

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

  return (
    <div className="flex flex-col gap-4">
      {/* Estado de carga / error del fetch principal */}
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ico">Tablero ICO</TabsTrigger>
          {/* <TabsTrigger value="compliance">Cumplimiento</TabsTrigger>
          <TabsTrigger value="deployment">Matriz de despliegue</TabsTrigger> */}
        </TabsList>

        <TabsContent value="ico" className="mt-4">
          <IcoBoard data={data} year={Number(year)} />
          <AnnualIcoTrendCard data={data} year={Number(year)} />
        </TabsContent>

        {/* <TabsContent value="compliance" className="mt-4">
          <ObjectivesCompliance
            planId={planId}
            positionId={positionId}
            year={year}
          />
        </TabsContent>

        <TabsContent value="deployment" className="mt-4">
          <DeploymentMatrix
            planId={planId}
            positionId={positionId}
            year={year}
          />
        </TabsContent> */}
      </Tabs>
    </div>
  );
}
