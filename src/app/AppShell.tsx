"use client";

import * as React from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { getAccessToken } from "@/shared/auth/storage";

const PUBLIC_PREFIXES = ["/login", "/forgot-password", "/reset-password"];
const isPublicRoute = (p: string | null) =>
  !!p && PUBLIC_PREFIXES.some((x) => p.startsWith(x));

export default function AppShell({ children }: { children: React.ReactNode }) {
  // Hooks SIEMPRE en el mismo orden
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isPublic = React.useMemo(() => isPublicRoute(pathname), [pathname]);

  // Marcador de montaje (para poder leer localStorage)
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Estado de autorización ya calculado (evita flash)
  const [authChecked, setAuthChecked] = React.useState(false);
  const [allowed, setAllowed] = React.useState(false);

  // Evita redirecciones múltiples
  const redirectedRef = React.useRef(false);

  // ÚNICO efecto que:
  // 1) lee token
  // 2) decide si permitir
  // 3) (si no) redirige a /login una sola vez
  React.useEffect(() => {
    if (!mounted) return;

    const token = getAccessToken();
    const canStay = isPublic || !!token;

    setAllowed(canStay);
    setAuthChecked(true);

    if (canStay) {
      redirectedRef.current = false; // reset guard
      return;
    }

    if (redirectedRef.current) return;
    redirectedRef.current = true;

    // Construye el redirect SOLO si no hay token y la ruta no es pública
    const qs = searchParams?.toString();
    const dest = `${pathname}${qs ? `?${qs}` : ""}`;
    router.replace(`/login?redirect=${encodeURIComponent(dest)}`);
  }, [mounted, isPublic, pathname, searchParams, router]);

  // Hasta terminar la verificación, no pintes nada (así no hay flash)
  if (!mounted || !authChecked) return null;

  // Si no está permitido, esperamos a que el router nos lleve a /login
  if (!allowed) return null;

  return <>{children}</>;
}
