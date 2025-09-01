"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Edit3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface DefinitionCardProps {
  sectionKey: string;
  title: string;
  content: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  cardColor: string;
  cardBorderColor: string;
  contentColor: string;
  contentBorderColor: string;
  isEditing: boolean;
  editText: string;
  hovered: boolean;
  onHover: (key: string | null) => void;
  onEditClick: () => void;
  onChangeText: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function DefinitionCard({
  sectionKey,
  title,
  content,
  icon: Icon,
  iconColor,
  iconBg,
  cardColor,
  cardBorderColor,
  contentColor,
  contentBorderColor,
  isEditing,
  editText,
  hovered,
  onHover,
  onEditClick,
  onChangeText,
  onSave,
  onCancel,
}: DefinitionCardProps) {
  return (
    <Card
      className={`relative group border-0 shadow-sm ${cardColor} hover:shadow-lg transition-all duration-300 rounded-xl border ${cardBorderColor}`}
      onMouseEnter={() => onHover(sectionKey)}
      onMouseLeave={() => onHover(null)}
    >
      <CardHeader>
        <CardTitle className="text-lg text-gray-900 flex items-center justify-between heading-optimized">
          <div className="flex items-center">
            <div className={`rounded-lg ${iconBg} mr-3`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            {title}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-all duration-200 rounded-lg ${
              hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
            }`}
            onClick={onEditClick}
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editText}
              onChange={(e) => onChangeText(e.target.value.slice(0, 500))}
              className="min-h-[100px] resize-none bg-white border border-gray-200 rounded-lg text-sm p-3"
              placeholder={`Enter ${title.toLowerCase()}...`}
            />
            <div className="flex justify-between items-center">
              <span
                className={`text-xs ${
                  editText.length > 450 ? "text-red-500" : "text-gray-500"
                }`}
              >
                {500 - editText.length} characters left
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={onSave}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`p-4 ${contentColor} rounded-lg border ${contentBorderColor}`}
          >
            <p className="text-sm text-gray-700 leading-relaxed text-optimized">
              {content}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
