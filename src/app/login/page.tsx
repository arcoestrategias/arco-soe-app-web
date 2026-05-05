"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LoginForm from "@/features/auth/components/login-form";
import { CarouselSection } from "@/features/auth/components";
import Image from "next/image";
import { ModalTerms, type TermsData } from "@/features/auth/components/modal-terms";
import { useState } from "react";
import { authService } from "@/features/auth/services/authService";
import { getHumanErrorMessage } from "@/shared/api/response";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { reloadMe } = useAuth();
  const [showTerms, setShowTerms] = useState(false);
  const [termsData, setTermsData] = useState<TermsData | null>(null);

  useEffect(() => {
    const auth = searchParams.get('auth');
    const needsTerms = searchParams.get('needsTermsAcceptance') === 'true';

    if (auth === 'success') {
      // Limpiar parámetros de la URL
      router.replace('/login', { scroll: false });

      if (needsTerms) {
        setNeedsTermsAcceptance(true);
        // Cargar términos actuales
        authService
          .getCurrentTerms()
          .then((data) => {
            setTermsData(data);
            setShowTerms(true);
          })
          .catch((err) => {
            toast.error(getHumanErrorMessage(err));
          });
      } else {
        // Redirigir a dashboard
        router.push('/resume');
      }
    }
  }, [searchParams, router, reloadMe]);

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
          <LoginForm defaultRedirectTo="/resume" />
        </div>
        <footer className="border-t border-gray-200 p-4 text-center">
          <p className="text-[10px] text-gray-500">
            © 2024 SOE Platform. Todos los derechos reservados.
          </p>
        </footer>
      </div>

      {/* Modal de términos después de Google OAuth */}
      {showTerms && termsData && (
        <ModalTerms
          open={showTerms}
          onOpenChange={setShowTerms}
          title="Términos y Condiciones"
        />
      )}
    </div>
  );
}