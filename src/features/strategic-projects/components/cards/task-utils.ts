import type {
  StrategicProjectStructureTask as Task,
  TaskParticipant,
} from "../../types/strategicProjectStructure";

export function toggleTaskStatus(
  task: Task,
  onSave: (task: Task, participants: TaskParticipant[]) => void
) {
  const isFinished = (task.status ?? "").toUpperCase() === "CLO";
  const updatedTask: Task = {
    ...task,
    status: isFinished ? "OPE" : "CLO",
    finishedAt: isFinished ? null : new Date().toISOString(),
  };
  const participants = task.participants ?? [];
  onSave(updatedTask, participants);
}