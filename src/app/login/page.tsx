"use client";

import LoginForm from "@/features/auth/components/login-form";
import { CarouselSection } from "@/features/auth/components";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Visual lateral en desktop */}
      <div className="hidden lg:flex lg:w-1/2">
        <CarouselSection />
      </div>

      {/* Logo en mobile */}
      <div className="lg:hidden h-32 bg-gradient-to-r from-[#FF8A65] to-[#7986CB] flex items-center justify-center">
        <Image
          src="/logo-soe.svg"
          alt="SOE Logo"
          width={280}
          height={65}
          className="h-12 w-auto"
          priority
        />
      </div>

      {/* Formulario */}
      <div className="flex-1 lg:w-1/2 bg-gray-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8">
          {/* 👇 usa la prop soportada por LoginForm */}
          <LoginForm defaultRedirectTo="/resumen" />
        </div>

        <footer className="border-t border-gray-200 p-4 text-center">
          <p className="text-[10px] text-gray-500">
            © 2024 SOE Platform. Todos los derechos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
}
