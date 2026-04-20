interface TaskTableHeaderProps {
  factorName: string;
  completedTasks: number;
  totalTasks: number;
}

export function TaskTableHeader({
  factorName,
  completedTasks,
  totalTasks,
}: TaskTableHeaderProps) {
  return (
    <div className="bg-blue-50">
      <div className="grid grid-cols-[35%_30%_15%_10%_10%]">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
            Tareas
          </span>
        </div>
        <div className="flex items-center px-3 py-2">
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
            Responsables
          </span>
        </div>
        <div className="flex items-center justify-center px-3 py-2">
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
            Fechas
          </span>
        </div>
        <div className="flex items-center justify-center px-3 py-2">
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
            Estado
          </span>
        </div>
        <div className="flex items-center justify-end px-3 py-2">
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
            Acciones
          </span>
        </div>
      </div>
    </div>
  );
}
