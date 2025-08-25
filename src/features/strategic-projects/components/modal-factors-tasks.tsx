"use client";

import { ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HierarchicalTable } from "./hierarchical-table";
import { useFactorsTasks } from "../hooks/useFactorsTasks";

interface ModalFactorsTasksProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
}

export function ModalFactorsTasks({
  isOpen,
  onClose,
  projectId,
  projectName,
}: ModalFactorsTasksProps) {
  const {
    factors,
    loading,
    toggleExpandFactor,
    toggleExpandAll,
    addFactor,
    editFactor,
    saveFactor,
    cancelFactor,
    deleteFactor,
    reorderFactors,
    addTask,
    editTask,
    saveTask,
    cancelTask,
    deleteTask,
    reorderTasks,
    countCompletedTasks,
    hasItemInCreation,
  } = useFactorsTasks(projectId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[80vw] !max-w-[80vw] p-0 overflow-hidden">
        <DialogTitle className="px-5 pt-5 pb-0 text-lg font-semibold text-gray-900">
          Factores Clave de Éxito y Tareas
        </DialogTitle>
        <p className="px-5 text-sm text-gray-600 -mt-1 mb-2">{projectName}</p>

        <div className="flex flex-col h-[85vh]">
          {/* Botones */}
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <Button
              variant="outline"
              className="gap-2"
              onClick={toggleExpandAll}
            >
              {factors.every((f) => f.expandido) ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Colapsar todo
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Expandir todo
                </>
              )}
            </Button>

            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={addFactor}
            >
              + Nuevo Factor
            </Button>
          </div>

          {/* Tabla */}
          <div className="flex-1 overflow-auto bg-white p-5">
            <HierarchicalTable
              factors={factors}
              loading={loading}
              toggleExpandFactor={toggleExpandFactor}
              editFactor={editFactor}
              saveFactor={saveFactor}
              cancelFactor={cancelFactor}
              deleteFactor={deleteFactor}
              reorderFactors={reorderFactors}
              addTask={addTask}
              editTask={editTask}
              saveTask={saveTask}
              cancelTask={cancelTask}
              deleteTask={deleteTask}
              reorderTasks={reorderTasks}
              countCompletedTasks={countCompletedTasks}
              hasItemInCreation={hasItemInCreation}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
