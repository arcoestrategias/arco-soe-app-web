import { http } from "@/shared/api/http";
import { unwrapAny } from "@/shared/api/response";
import { routes } from "@/shared/api/routes";
import {
  clearAuthSession,
  clearBusinessUnit,
  getAccessToken,
  getBusinessUnitId,
  setBusinessUnitId,
  setPositionId,
  setTokens,
} from "@/shared/auth/storage";

export interface LoginDto {
  email: string;
  password: string;
}
export interface LoginResult {
  accessToken: string;
  refreshToken?: string;
}
export interface BusinessUnitLite {
  id: string;
  name: string;
  positionId?: string | null;
  positionName?: string | null;
}

export interface CompanyBU {
  id: string;
  name: string;
}
export interface Company {
  id: string;
  name: string;
  businessUnits?: CompanyBU[];
}

export interface MeData {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  isPlatformAdmin?: boolean;

  companies?: Company[];
  needsBusinessUnit?: boolean;
  businessUnits?: BusinessUnitLite[];
  currentBusinessUnit?: BusinessUnitLite | null;
  permissions?: string[];
}

export const authService = {
  async login(dto: LoginDto): Promise<LoginResult> {
    const res = await http.post(routes.auth.login(), dto);
    const payload = unwrapAny<LoginResult>(res);
    setTokens(payload.accessToken, payload.refreshToken ?? null);
    return payload;
  },

  async logout(): Promise<void> {
    try {
      if (getAccessToken()) {
        await http.post<void>(routes.auth.logout(), {});
      }
    } catch {
      /* noop */
    } finally {
      clearAuthSession();
    }
  },

  async me(): Promise<MeData> {
    const res = await http.get(routes.users.me());
    const data = unwrapAny<MeData>(res);

    // === Admin de plataforma ===
    if (data.isPlatformAdmin) {
      // El back hace bypass de BU; evita headers residuales y deja "sin posición"
      clearBusinessUnit();
      setPositionId(null); // ➜ guarda "" en soe.positionId (helper lo normaliza)
      return data;
    }

    // === NO admin ===
    const storedBU = getBusinessUnitId();
    const apiBU = data.currentBusinessUnit?.id ?? null;

    // Si el back dice que el header era inválido / no asignado:
    if (storedBU && data.currentBusinessUnit === null) {
      clearBusinessUnit();
      setPositionId(null); // ➜ sin posición
      return data;
    }

    // Si el back auto-usó la única BU o devolvió currentBusinessUnit:
    if (!storedBU && apiBU) {
      setBusinessUnitId(apiBU);
    }

    // 💾 PERSISTIR SIEMPRE EL POSITION ID (cuando exista)
    const posId = data.currentBusinessUnit?.positionId ?? null;
    if (posId) {
      setPositionId(posId); // ➜ "uuid" en soe.positionId
    } else {
      setPositionId(null); // ➜ "" en soe.positionId
    }

    return data;
  },
};
