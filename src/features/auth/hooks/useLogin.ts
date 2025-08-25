import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/authService";
import type { LoginDto, LoginData } from "./../types/types";

export function useLogin() {
  return useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: async (dto: LoginDto) => {
      const res = await authService.login(dto);
      return res as LoginData;
    },
  });
}
