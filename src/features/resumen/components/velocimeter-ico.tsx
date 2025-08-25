"use client";

import { useEffect, useState } from "react";

interface VelocimeterICOProps {
  value: number;
  title?: string;
}

export function VelocimeterICO({
  value,
  title = "Company ICO Average",
}: VelocimeterICOProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 500);
    return () => clearTimeout(timer);
  }, [value]);

  const getColor = (val: number) => {
    if (val >= 90) return { color: "#10b981", label: "Excellent" };
    if (val >= 70) return { color: "#f59e0b", label: "Average" };
    return { color: "#ef4444", label: "Critical" };
  };

  const colorInfo = getColor(animatedValue);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset =
    circumference - (animatedValue / 100) * circumference;

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-8 text-center heading-optimized">
          {title}
        </h3>

        {/* Circle Chart */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32">
            <svg
              className="w-32 h-32 transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke={colorInfo.color}
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: "stroke-dashoffset 2s ease-in-out",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-gray-900">
                {Math.round(animatedValue)}%
              </div>
              <div className="text-xs text-gray-600 mt-1">ICO</div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium"
            style={{
              backgroundColor: `${colorInfo.color}20`,
              color: colorInfo.color,
            }}
          >
            <div
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: colorInfo.color }}
            ></div>
            {colorInfo.label}
          </div>
        </div>

        {/* Scale */}
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-2000 ease-out"
              style={{
                width: `${animatedValue}%`,
                backgroundColor: colorInfo.color,
              }}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Critical (&lt;70%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Average (70–89%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Excellent (90–100%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
