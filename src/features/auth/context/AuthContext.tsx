// src/features/auth/context/AuthContext.tsx
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  authService,
  BusinessUnitLite,
  LoginDto,
  MeData,
} from "../services/authService";
import {
  clearBusinessUnit,
  clearTokens,
  getAccessToken,
  setBusinessUnitId,
} from "@/shared/auth/storage";

type AuthState = {
  me: MeData | null;
  permissions: string[];
  businessUnits: BusinessUnitLite[];
  needsSelection: boolean; // true cuando el backend dice "needsBusinessUnit"
  loading: boolean; // carga de /me o acciones auth
  initializing: boolean; // hidratar sesión al montar la app
};

type AuthContextValue = AuthState & {
  login: (dto: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  reloadMe: () => Promise<void>;
  selectBusinessUnit: (
    buId: string,
    opts?: { fireAndForget?: boolean }
  ) => Promise<void>;
  clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    me: null,
    permissions: [],
    businessUnits: [],
    needsSelection: false,
    loading: false,
    initializing: true,
  });

  const router = useRouter();
  const mountedRef = useRef(false);

  // --- Helpers de estado ---
  const setLoading = (v: boolean) => setState((s) => ({ ...s, loading: v }));
  const setInitializing = (v: boolean) =>
    setState((s) => ({ ...s, initializing: v }));

  const clearSession = useCallback(() => {
    clearTokens();
    clearBusinessUnit();
    setState({
      me: null,
      permissions: [],
      businessUnits: [],
      needsSelection: false,
      loading: false,
      initializing: false,
    });
  }, []);

  const applyMe = useCallback((data: MeData | null) => {
    const needsSelection = Boolean(data?.needsBusinessUnit);
    const businessUnits = data?.businessUnits ?? [];
    const permissions = data?.permissions ?? [];
    setState((s) => ({
      ...s,
      me: data,
      permissions,
      businessUnits,
      needsSelection,
    }));
  }, []);

  // Extrae un "status" usable desde distintos tipos de error (fetch/axios/custom)
  function extractStatus(err: unknown): number | undefined {
    const anyE = err as any;
    if (typeof anyE?.status === "number") return anyE.status;
    if (typeof anyE?.response?.status === "number") return anyE.response.status;
    if (typeof anyE?.code === "number") return anyE.code;
    if (typeof anyE?.code === "string") {
      const n = Number(anyE.code);
      if (Number.isFinite(n)) return n;
    }
    return undefined;
  }

  // --- /users/me ---
  const reloadMe = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authService.me();
      applyMe(data ?? null);
    } catch (e: unknown) {
      // Solo invalidar sesión si es 401/403. Mantener contexto (BU/Company) en otros errores.
      const status = extractStatus(e);

      const isAuthError = status === 401 || status === 403;
      if (isAuthError) {
        clearTokens();
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    } finally {
      setLoading(false);
    }
  }, [applyMe, clearSession]);

  // --- login ---
  const login = useCallback(
    async (dto: LoginDto) => {
      setLoading(true);
      try {
        await authService.login(dto);
        await reloadMe();
      } finally {
        setLoading(false);
      }
    },
    [reloadMe]
  );

  // --- logout ---
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      clearSession();
      setLoading(false);
      router.push("/login");
    }
  }, [clearSession, router]);

  // --- selección de BU ---
  const selectBusinessUnit = useCallback(
    async (buId: string, opts?: { fireAndForget?: boolean }) => {
      if (!buId) return;
      setBusinessUnitId(buId);
      if (opts?.fireAndForget) {
        // refresca /me sin bloquear la UI
        reloadMe().catch(() => {});
        return;
      }
      await reloadMe();
    },
    [reloadMe]
  );

  // --- Hidratar sesión al montar: si hay token, intentamos /me ---
  useEffect(() => {
    if (mountedRef.current) return; // evita doble invocación en Strict Mode
    mountedRef.current = true;

    (async () => {
      try {
        if (getAccessToken()) {
          await reloadMe(); // se llama una vez
        }
      } finally {
        setInitializing(false);
      }
    })();
  }, [reloadMe, setInitializing]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      reloadMe,
      selectBusinessUnit,
      clearSession,
    }),
    [state, login, logout, reloadMe, selectBusinessUnit, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
