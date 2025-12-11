"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Role } from "../types/types";

// Schema for validation
const roleSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  description: z.string().optional(),
});

export type RoleFormData = z.infer<typeof roleSchema>;

interface ModalRoleProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    mode: "crear" | "editar";
    id?: string;
    payload: RoleFormData;
  }) => void;
  modo: "crear" | "editar";
  role: Role | null;
  isPending: boolean;
}

export function ModalRole({
  isOpen,
  onClose,
  onSave,
  modo,
  role,
  isPending,
}: ModalRoleProps) {
  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen && modo === "editar" && role) {
      form.reset({
        name: role.name,
        description: role.description ?? "",
      });
    } else if (isOpen && modo === "crear") {
      form.reset({ name: "", description: "" });
    }
  }, [isOpen, modo, role, form]);

  const onSubmit = (data: RoleFormData) => {
    onSave({ mode: modo, id: role?.id, payload: data });
  };

  const title = modo === "crear" ? "Crear Nuevo Rol" : "Editar Rol";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {modo === "crear"
              ? "Completa los detalles para el nuevo rol."
              : "Modifica el nombre o la descripción del rol."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Rol</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Gerente de Proyectos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe las responsabilidades principales de este rol"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
