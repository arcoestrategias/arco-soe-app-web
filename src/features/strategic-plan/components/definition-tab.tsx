"use client";

import { useState } from "react";
import { DefinitionCard } from "./definition-card";
import { DefinitionList } from "./definition-list";
import { Target, Eye, Award, Layers, CheckCircle, Heart } from "lucide-react";

const initialSectionData = {
  mission: {
    title: "Mission",
    content:
      "Deliver innovative strategic solutions that drive sustainable growth and operational excellence.",
    icon: Target,
    cardColor: "bg-orange-50",
    cardBorderColor: "border-orange-200",
    contentColor: "bg-white/70",
    contentBorderColor: "border-orange-100",
    iconColor: "text-orange-600",
    iconBg: "bg-orange-100",
  },
  vision: {
    title: "Vision",
    content:
      "Be recognized as leaders in strategic transformation, creating value through future-defining solutions.",
    icon: Eye,
    cardColor: "bg-blue-50",
    cardBorderColor: "border-blue-200",
    contentColor: "bg-white/70",
    contentBorderColor: "border-blue-100",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
  },
  advantages: {
    title: "Advantages",
    content:
      "We combine sector expertise, agile methodologies, and advanced technologies to deliver measurable and sustainable results.",
    icon: Award,
    cardColor: "bg-emerald-50",
    cardBorderColor: "border-emerald-200",
    contentColor: "bg-white/70",
    contentBorderColor: "border-emerald-100",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
  },
  factors: {
    title: "Critical Factors",
    icon: Layers,
    cardColor: "bg-purple-50",
    cardBorderColor: "border-purple-200",
    itemColor: "bg-purple-25",
    itemBorderColor: "border-purple-100",
    iconColor: "text-purple-600",
    iconBg: "bg-purple-100",
    badgeColor: "bg-purple-500",
    items: [
      { id: 1, content: "Continuous technological innovation" },
      { id: 2, content: "Talent development and retention" },
      { id: 3, content: "Optimized operational efficiency" },
      { id: 4, content: "Customer satisfaction and loyalty" },
      { id: 5, content: "Strategic market expansion" },
      { id: 6, content: "Sustainability and social responsibility" },
    ],
  },
  objectives: {
    title: "Strategic Objectives",
    icon: CheckCircle,
    cardColor: "bg-pink-50",
    cardBorderColor: "border-pink-200",
    itemColor: "bg-pink-25",
    itemBorderColor: "border-pink-100",
    iconColor: "text-pink-600",
    iconBg: "bg-pink-100",
    badgeColor: "bg-pink-500",
    items: [
      { id: 1, content: "Increase revenue by 25% in 3 years" },
      { id: 2, content: "Expand into 3 new international markets" },
      { id: 3, content: "Launch 5 innovative solutions per year" },
      { id: 4, content: "Reduce operating costs by 15%" },
      { id: 5, content: "100% employee development program" },
      { id: 6, content: "Reduce carbon footprint by 30%" },
    ],
  },
  values: {
    title: "Core Values",
    icon: Heart,
    cardColor: "bg-red-50",
    cardBorderColor: "border-red-200",
    itemColor: "bg-red-25",
    itemBorderColor: "border-red-100",
    iconColor: "text-red-600",
    iconBg: "bg-red-100",
    badgeColor: "bg-red-500",
    items: [
      { id: 1, content: "Integrity and transparency" },
      { id: 2, content: "Excellence and continuous improvement" },
      { id: 3, content: "Innovation and disruptive thinking" },
      { id: 4, content: "Collaboration and teamwork" },
      { id: 5, content: "Customer-centric mindset" },
      { id: 6, content: "Responsibility and ethics" },
    ],
  },
  projects: {
    title: "Strategic Projects",
    icon: Layers,
    cardColor: "bg-green-50",
    cardBorderColor: "border-green-200",
    itemColor: "bg-green-25",
    itemBorderColor: "border-green-100",
    iconColor: "text-green-600",
    iconBg: "bg-green-100",
    badgeColor: "bg-green-500",
    items: [
      { id: 1, content: "Digital Business Transformation" },
      { id: 2, content: "ISO 9001 Quality Management System" },
      { id: 3, content: "Integrated E-commerce Platform" },
      { id: 4, content: "Continuous Training Program" },
      { id: 5, content: "Operational Process Automation" },
      { id: 6, content: "Innovation and R&D Center" },
    ],
  },
};

export function DefinitionTab() {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [sectionData, setSectionData] = useState(initialSectionData);
  const [editingListKey, setEditingListKey] = useState<string | null>(null);

  const handleEditClick = (key: string) => {
    const section = sectionData[key as keyof typeof sectionData];
    if ("content" in section) {
      setEditingKey(key);
      setEditText(section.content);
    }
  };

  const handleSave = () => {
    if (!editingKey) return;
    setSectionData((prev) => ({
      ...prev,
      [editingKey]: {
        ...prev[editingKey as keyof typeof sectionData],
        content: editText,
      },
    }));
    setEditingKey(null);
    setEditText("");
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditText("");
  };

  return (
    <div className="space-y-6 font-system">
      {/* Fila 1: Misión y Visión */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(["mission", "vision"] as const).map((key) => {
          const data = sectionData[key];
          return (
            <DefinitionCard
              key={key}
              sectionKey={key as keyof typeof sectionData}
              title={data.title}
              content={data.content}
              icon={data.icon}
              iconColor={data.iconColor}
              iconBg={data.iconBg}
              cardColor={data.cardColor}
              cardBorderColor={data.cardBorderColor}
              contentColor={data.contentColor}
              contentBorderColor={data.contentBorderColor}
              isEditing={editingKey === key}
              editText={editText}
              hovered={hoveredKey === key}
              onHover={setHoveredKey}
              onEditClick={() => handleEditClick(key)}
              onChangeText={setEditText}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          );
        })}
      </div>

      {/* Fila 2: Ventajas */}
      <div>
        <DefinitionCard
          sectionKey="advantages"
          title={sectionData.advantages.title}
          content={sectionData.advantages.content}
          icon={sectionData.advantages.icon}
          iconColor={sectionData.advantages.iconColor}
          iconBg={sectionData.advantages.iconBg}
          cardColor={sectionData.advantages.cardColor}
          cardBorderColor={sectionData.advantages.cardBorderColor}
          contentColor={sectionData.advantages.contentColor}
          contentBorderColor={sectionData.advantages.contentBorderColor}
          isEditing={editingKey === "advantages"}
          editText={editText}
          hovered={hoveredKey === "advantages"}
          onHover={setHoveredKey}
          onEditClick={() => handleEditClick("advantages")}
          onChangeText={setEditText}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>

      {/* Fila 3: Factores y Objetivos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(["factors", "objectives"] as const).map((key) => {
          const data = sectionData[key];
          return (
            <DefinitionList
              key={key}
              sectionKey={key}
              title={data.title}
              items={data.items}
              icon={data.icon}
              iconColor={data.iconColor}
              iconBg={data.iconBg}
              cardColor={data.cardColor}
              cardBorderColor={data.cardBorderColor}
              itemColor={data.itemColor}
              itemBorderColor={data.itemBorderColor}
              badgeColor={data.badgeColor}
              hovered={hoveredKey === key}
              onHover={setHoveredKey}
              isEditing={editingListKey === key}
              onStartEdit={() => setEditingListKey(key)}
              onCancelEdit={() => setEditingListKey(null)}
              onSaveEdit={(updatedItems) => {
                setSectionData((prev) => ({
                  ...prev,
                  [key]: {
                    ...prev[key],
                    items: updatedItems,
                  },
                }));
                setEditingListKey(null);
              }}
            />
          );
        })}
      </div>

      {/* Fila 4: Proyectos y Valores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(["projects", "values"] as const).map((key) => {
          const data = sectionData[key];
          return (
            <DefinitionList
              key={key}
              sectionKey={key}
              title={data.title}
              items={data.items}
              icon={data.icon}
              iconColor={data.iconColor}
              iconBg={data.iconBg}
              cardColor={data.cardColor}
              cardBorderColor={data.cardBorderColor}
              itemColor={data.itemColor}
              itemBorderColor={data.itemBorderColor}
              badgeColor={data.badgeColor}
              hovered={hoveredKey === key}
              onHover={setHoveredKey}
              isEditing={editingListKey === key}
              onStartEdit={() => setEditingListKey(key)}
              onCancelEdit={() => setEditingListKey(null)}
              onSaveEdit={(updatedItems) => {
                setSectionData((prev) => ({
                  ...prev,
                  [key]: {
                    ...prev[key],
                    items: updatedItems,
                  },
                }));
                setEditingListKey(null);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
