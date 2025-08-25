"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getHumanErrorMessage } from "@/shared/api/response";
import type { CompleteCompany } from "../types";
import {
  getCompanies,
  // createCompany,
  // updateCompany,
  // deleteCompany,
  // fullCreateCompany,
} from "../services/companiesService";

export function useCompanies() {
  const qc = useQueryClient();

  const { data: companies = [], isLoading } = useQuery<CompleteCompany[]>({
    queryKey: ["companies"],
    queryFn: getCompanies,
    refetchOnWindowFocus: false,
  });

  // const create = useMutation({
  //   mutationFn: (
  //     payload: Pick<
  //       CompleteCompany,
  //       "nombre" | "identificacion" | "descripcion"
  //     >
  //   ) => createCompany(payload),
  //   onSuccess: () => {
  //     qc.invalidateQueries({ queryKey: ["companies"] });
  //     toast.success("Empresa creada");
  //   },
  //   onError: (err) => toast.error(getHumanErrorMessage(err)),
  // });

  // const update = useMutation({
  //   mutationFn: ({
  //     id,
  //     data,
  //   }: {
  //     id: string;
  //     data: Partial<
  //       Pick<CompleteCompany, "nombre" | "identificacion" | "descripcion">
  //     >;
  //   }) => updateCompany(id, data),
  //   onSuccess: () => {
  //     qc.invalidateQueries({ queryKey: ["companies"] });
  //     toast.success("Empresa actualizada");
  //   },
  //   onError: (err) => toast.error(getHumanErrorMessage(err)),
  // });

  // const remove = useMutation({
  //   mutationFn: (id: string) => deleteCompany(id),
  //   onSuccess: () => {
  //     qc.invalidateQueries({ queryKey: ["companies"] });
  //     toast.success("Empresa eliminada");
  //   },
  //   onError: (err) => toast.error(getHumanErrorMessage(err)),
  // });

  // const fullCreate = useMutation({
  //   mutationFn: (
  //     payload: Pick<
  //       CompleteCompany,
  //       "nombre" | "identificacion" | "descripcion"
  //     >
  //   ) => fullCreateCompany(payload),
  //   onSuccess: () => {
  //     qc.invalidateQueries({ queryKey: ["companies"] });
  //     toast.success("Empresa creada con estructura");
  //   },
  //   onError: (err) => toast.error(getHumanErrorMessage(err)),
  // });

  return {
    companies,
    isLoading,
    // create: create.mutate,
    // update: update.mutate,
    // remove: remove.mutate,
    // fullCreate: fullCreate.mutate,
  };
}
