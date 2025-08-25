"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Target,
  CheckSquare,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import { mockProjects } from "../data/mock-projects";
import { formatCurrency } from "@/shared/utils";
import { ModalFactorsTasks } from "./modal-factors-tasks";
import { ProjectCard } from "./project-card";

export function StrategicProjectsDashboard() {
  const [animatedProgress, setAnimatedProgress] = useState<{
    [key: number]: number;
  }>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"factors" | "tasks">("factors");
  const [selectedProject, setSelectedProject] = useState<{
    id: number;
    name: string;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const newProgress: { [key: number]: number } = {};
      mockProjects.forEach((project) => {
        newProgress[project.id] = project.cumplimiento;
      });
      setAnimatedProgress(newProgress);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const openModal = (
    type: "factors" | "tasks",
    projectId: number,
    projectName: string
  ) => {
    setModalType(type);
    setSelectedProject({ id: projectId, name: projectName });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedProject(null);
  };

  const totalProjects = mockProjects.length;
  const avgProgress = Math.round(
    mockProjects.reduce((acc, p) => acc + p.cumplimiento, 0) / totalProjects
  );
  const totalBudget = mockProjects.reduce(
    (acc, p) => acc + p.presupuestoProyecto,
    0
  );
  const totalExecuted = mockProjects.reduce(
    (acc, p) => acc + p.presupuestoReal,
    0
  );

  return (
    <div className="space-y-6 font-system">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Proyectos Estratégicos
          </h1>
          <p className="text-sm text-gray-600">
            Gestiona y monitorea el progreso de todos los proyectos estratégicos
          </p>
        </div>
        <Button className="bg-gradient-to-r from-[#FF6B35] to-[#E55A2B] hover:from-[#E55A2B] hover:to-[#D14A1F] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-600">Total Proyectos</p>
                <p className="text-xl font-bold text-blue-700">
                  {totalProjects}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-green-600">Promedio Cumplimiento</p>
                <p className="text-xl font-bold text-green-700">
                  {avgProgress}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-purple-600">Presupuesto Total</p>
                <p className="text-xl font-bold text-purple-700">
                  {formatCurrency(totalBudget)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-orange-600">Ejecutado</p>
                <p className="text-xl font-bold text-orange-700">
                  {formatCurrency(totalExecuted)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de proyectos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {mockProjects.map((project) => (
          <ProjectCard
            key={project.id}
            {...project}
            animatedProgress={animatedProgress[project.id] || 0}
            onOpenModal={openModal}
          />
        ))}
      </div>

      {/* Modal */}
      {modalOpen && selectedProject && (
        <ModalFactorsTasks
          isOpen={modalOpen}
          onClose={closeModal}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
        />
      )}
    </div>
  );
}
