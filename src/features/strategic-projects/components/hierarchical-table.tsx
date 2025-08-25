"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { Factor, Task } from "../types/types";
import { SortableFactor } from "./sortable-factor";
import { toast } from "sonner";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

interface HierarchicalTableProps {
  factors: Factor[];
  loading: boolean;
  toggleExpandFactor: (factorId: number) => void;
  editFactor: (factorId: number) => void;
  saveFactor: (factor: Factor) => void;
  cancelFactor: (factorId: number, isNew?: boolean) => void;
  deleteFactor: (factorId: number) => void;
  reorderFactors: (newOrder: Factor[]) => void;
  addTask: (factorId: number) => void;
  editTask: (factorId: number, taskId: number) => void;
  saveTask: (factorId: number, task: Task) => void;
  cancelTask: (factorId: number, taskId: number, isNew?: boolean) => void;
  deleteTask: (factorId: number, taskId: number) => void;
  reorderTasks: (factorId: number, newOrder: Task[]) => void;
  countCompletedTasks: (tasks: Task[]) => number;
  hasItemInCreation: () => boolean;
}

export function HierarchicalTable({
  factors,
  loading,
  toggleExpandFactor,
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
}: HierarchicalTableProps) {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    // Validación: ¿hay factor en edición?
    const editingFactor = factors.find((f) => f.enEdicion);
    if (editingFactor) {
      toast.error(
        `No se puede cambiar el orden del factor porque se está editando el factor: ${editingFactor.descripcion}`
      );
      return;
    }

    // Validación: ¿hay tarea en edición?
    const editingTask = factors
      .flatMap((f) => f.tareas)
      .find((t) => t.enEdicion);
    if (editingTask) {
      toast.error(
        `No se puede cambiar el orden del factor porque se está editando la tarea: ${editingTask.nombre}`
      );
      return;
    }

    // Continúa con el drag si todo está libre
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = factors.findIndex((f) => f.id === active.id);
    const newIndex = factors.findIndex((f) => f.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(factors, oldIndex, newIndex).map(
        (factor, index) => ({ ...factor, orden: index + 1 })
      );
      reorderFactors(reordered);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-2">
            {/* Fila del factor */}
            <Skeleton className="h-12 w-full rounded-md" />

            {/* Fila de una tarea asociada */}
            <div className="pl-8">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      {/* Encabezado */}
      <div className="grid grid-cols-12 gap-2 bg-gray-100 p-3 text-xs font-medium text-gray-600">
        <div className="col-span-4">Descripción</div>
        <div className="col-span-4">Resultado / Entregable</div>
        <div className="col-span-2">Estado</div>
        <div className="col-span-2 text-right">Acciones</div>
      </div>

      {/* Contenido */}
      <div className="divide-y">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={factors.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {factors.map((factor) => (
              <div key={factor.id} className="py-1">
                <SortableFactor
                  factor={factor}
                  onToggleExpand={() => toggleExpandFactor(factor.id)}
                  onEdit={() => editFactor(factor.id)}
                  onSave={saveFactor}
                  onCancel={() => cancelFactor(factor.id, factor.esNuevo)}
                  onDelete={() => deleteFactor(factor.id)}
                  onAddTask={() => addTask(factor.id)}
                  countCompletedTasks={() => countCompletedTasks(factor.tareas)}
                  hasItemInCreation={hasItemInCreation}
                  onEditTask={editTask}
                  onSaveTask={saveTask}
                  onCancelTask={cancelTask}
                  onDeleteTask={deleteTask}
                  onReorderTasks={reorderTasks}
                />
              </div>
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
