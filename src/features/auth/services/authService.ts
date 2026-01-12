import { http } from "@/shared/api/http";
import { unwrapAny } from "@/shared/api/response";
import { routes } from "@/shared/api/routes";
import {
  clearAuthSession,
  clearBusinessUnit,
  getAccessToken,
  getBusinessUnitId,
  setBusinessUnitId,
  setCompanyId,
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
  companyId?: string | null;
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
  isPlatformAdmin: boolean;

  companies?: Company[];
  needsBusinessUnit?: boolean;
  businessUnits?: BusinessUnitLite[];
  currentCompanyId?: string | null;
  currentBusinessUnit?: BusinessUnitLite | null;
  permissions?: string[];
}

export interface ForgotPasswordRes {
  resetToken?: string;
}

export interface ConfirmEmailRes {
  message?: string;
}

export interface ResetPasswordRes {
  message?: string;
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

    const storedBU = getBusinessUnitId();
    const apiBU = data.currentBusinessUnit?.id ?? null;
    const isPlatformAdmin = !!data?.isPlatformAdmin;

    // === Admin de plataforma ===
    if (isPlatformAdmin) {
      // El back hace bypass de BU; evita headers residuales y deja "sin posición"

      if (!storedBU && apiBU) {
        setBusinessUnitId(apiBU);
        setCompanyId(data.currentCompanyId ?? null);
      }
      return data;
    }

    // Si el back dice que el header era inválido / no asignado:
    if (storedBU && apiBU === null) {
      return data;
    }

    // Si el back auto-usó la única BU o devolvió currentBusinessUnit:
    if (!storedBU && apiBU) {
      setBusinessUnitId(apiBU);
      setCompanyId(data.currentCompanyId ?? null);
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

  async forgotPassword(email: string): Promise<ForgotPasswordRes> {
    const res = await http.post(routes.auth.forgotPassword(), { email });
    return unwrapAny<ForgotPasswordRes>(res);
  },

  async sendEmailConfirmation(id: string) {
    const res = await http.post(routes.auth.sendConfirmationEmail(id));
    return unwrapAny(res);
  },

  async confirmEmail(token: string): Promise<ConfirmEmailRes> {
    const res = await http.post(routes.auth.confirm(), { token });
    return unwrapAny<ConfirmEmailRes>(res);
  },

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ResetPasswordRes> {
    const res = await http.post(routes.auth.resetPassword(), {
      token,
      newPassword,
    });
    return unwrapAny<ResetPasswordRes>(res);
  },
};
