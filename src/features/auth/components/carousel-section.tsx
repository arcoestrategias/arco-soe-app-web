"use client";

import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import Image from "next/image";

const slides = [
  {
    emoji: "🚀",
    title: "Convierte tu estrategia en resultados",
    description: "Transforma tus planes en acciones concretas y medibles",
  },
  {
    emoji: "📈",
    title: "Mejora tu rendimiento estratégico",
    description:
      "Optimiza tus procesos y alcanza tus objetivos con herramientas inteligentes",
  },
  {
    emoji: "🎯",
    title: "Gestiona prioridades fácilmente",
    description:
      "Organiza y prioriza tareas de manera eficiente para maximizar tu productividad",
  },
];

export function CarouselSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => setCurrentSlide(index);

  return (
    <div className="relative h-full bg-gradient-to-r from-[#FF8A65] via-[#FF7043] to-[#7986CB] flex flex-col justify-between p-8 lg:p-12 text-white overflow-hidden">
      <Image
        src="/logo-soe.svg"
        alt="SOE Logo"
        width={280}
        height={65}
        className="h-20 w-auto z-10 drop-shadow-[0_12px_12px_rgba(0,0,0,0.95)]"
        priority
      />

      <div className="flex-1 flex flex-col justify-center">
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((slide, index) => (
              <div key={index} className="w-full flex-shrink-0">
                <div className="text-6xl mb-6">{slide.emoji}</div>
                <h2 className="text-2xl lg:text-3xl font-semibold mb-6 leading-tight">
                  {slide.title}
                </h2>
                <p className="text-sm lg:text-base opacity-90 leading-relaxed mb-8">
                  {slide.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <button className="flex items-center space-x-2 text-white/90 hover:text-white transition-all duration-300 group">
          <span className="text-sm">Descubre más</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </button>
      </div>

      <div className="flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 hover:bg-white/60 ${
              index === currentSlide ? "w-8 bg-white" : "w-2 bg-white/40"
            }`}
          />
        ))}
      </div>

      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  );
}
