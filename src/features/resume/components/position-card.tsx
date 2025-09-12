"use client";

import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, Target, Award } from "lucide-react";
import type { OrgChartNodeDTO } from "../types/org-chart-overview";
import { useUserPhoto } from "@/features/users/hooks/use-user-photo";

function Metric({
  label,
  value,
  gradient,
  icon,
}: {
  label: string;
  value: number;
  gradient: string;
  icon: React.ReactNode;
}) {
  const [p, setP] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setP(Math.max(0, Math.min(100, value))), 120);
    return () => clearTimeout(t);
  }, [value]);

  const size = 56;
  const strokeWidth = 5;
  const r = (size - strokeWidth * 2) / 2;
  const C = 2 * Math.PI * r;
  const offset = C - (p / 100) * C;

  return (
    <div className="flex-1 min-w-0">
      <div
        className={`rounded-2xl p-3 h-[118px] flex flex-col items-center justify-between bg-gradient-to-r ${gradient} shadow-sm`}
      >
        <div className="flex items-center gap-1 text-white/90 text-[11px] font-medium leading-none">
          {icon}
          <span className="truncate">{label}</span>
        </div>
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            className="absolute inset-0 -rotate-90"
            width={size}
            height={size}
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="rgba(255,255,255,.25)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="rgba(255,255,255,.95)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={C}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{
                transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)",
              }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-white text-sm font-bold leading-none">
              {Math.round(p)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PositionCard({ node }: { node: OrgChartNodeDTO }) {
  const initials =
    (node.nameUser ?? node.namePosition)
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2) || "NA";

  // <<< NUEVO: obtener foto por idUser >>>
  const { data: imgUrl } = useUserPhoto(node.idUser);

  return (
    <div className="relative w-full rounded-3xl shadow-lg overflow-hidden pb-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[96px] -z-0 bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50" />

      <div className="relative z-10 px-3 pt-3 pb-2 bg-transparent">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-4 border-white shadow-xl ring-2 ring-gray-100 shrink-0 overflow-hidden">
            {imgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl}
                alt={node.nameUser ?? "Usuario"}
                className="h-full w-full object-cover"
              />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white font-bold text-xl">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 leading-snug line-clamp-2">
              {node.namePosition}
            </h3>
            <p className="mt-0.5 text-base text-gray-700 font-medium truncate">
              {node.nameUser ?? "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-2 pb-3 bg-white">
        <div className="flex gap-2">
          <Metric
            label="ICO"
            value={Number(node.ico ?? 0)}
            gradient="from-sky-400 to-cyan-400"
            icon={<Target className="h-4 w-4" />}
          />
          <Metric
            label="ICP"
            value={Number(node.icp ?? 0)}
            gradient="from-emerald-400 to-green-500"
            icon={<Award className="h-4 w-4" />}
          />
          <Metric
            label="Avance"
            value={Number(node.generalAverageProjects ?? 0)}
            gradient="from-orange-400 to-orange-500"
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </div>
      </div>
    </div>
  );
}
