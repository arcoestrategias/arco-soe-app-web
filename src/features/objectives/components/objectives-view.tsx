"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { IcoBoard } from "./ico-board";
import { ObjectivesCompliance } from "./objectives-compliance";
import { DeploymentMatrix } from "./deployment-matrix";

export default function ObjectivesView({
  planId,
  positionId,
  year,
}: {
  planId?: string;
  positionId?: string;
  year: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="ico" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ico">ICO Board</TabsTrigger>
          <TabsTrigger value="compliance">Cumplimiento</TabsTrigger>
          <TabsTrigger value="deployment">Matriz de despliegue</TabsTrigger>
        </TabsList>

        <TabsContent value="ico" className="mt-4">
          <IcoBoard planId={planId} positionId={positionId} year={year} />
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
