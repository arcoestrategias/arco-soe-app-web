"use client";

import * as React from "react";
import { useState } from "react";
import { Info, StickyNote, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TextareaWithCounter } from "@/shared/components/textarea-with-counter";
import { Separator } from "@/components/ui/separator";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import { QKEY } from "@/shared/api/query-keys";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useComments,
  useCreateComment,
  useUpdateComment,
  useInactivateComment,
} from "../hooks/use-comments";

type NotesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  referenceId: string;
  moduleShortcode?: string | null;
  title?: string;
};

export default function NotesModalMinimal({
  isOpen,
  onClose,
  referenceId,
  moduleShortcode = null,
  title = "Notas",
}: NotesModalProps) {
  // data
  const { data: notes = [], isPending } = useComments(referenceId);
  const invalidateKey = QKEY.commentsByReference(referenceId); // por si lo usas dentro de tus hooks

  // mutations
  const createMut = useCreateComment(invalidateKey);
  const updateMut = useUpdateComment(invalidateKey);
  const inactivateMut = useInactivateComment(invalidateKey);

  // state
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [confirm, setConfirm] = useState<{ open: boolean; id?: string }>({
    open: false,
  });

  const addNote = () => {
    const v = newNote.trim();
    if (!v) return;
    createMut.mutate({
      name: v,
      referenceId,
      moduleShortcode: moduleShortcode ?? undefined,
    });
    setNewNote("");
  };

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };
  const saveEdit = () => {
    if (!editingId) return;
    const v = editingText.trim();
    if (!v) return;
    updateMut.mutate({ id: editingId, payload: { name: v } });
    setEditingId(null);
    setEditingText("");
  };
  const askDelete = (id: string) => setConfirm({ open: true, id });
  const doDelete = () => {
    if (confirm.id) inactivateMut.mutate(confirm.id);
    setConfirm({ open: false });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>

          {/* Banner compacto */}
          <div className="mt-1 flex items-start gap-2 rounded-md bg-muted/40 p-2">
            <Info className="mt-0.5 h-4 w-4 opacity-70" />
            <p className="text-xs text-muted-foreground">
              Agrega notas u observaciones
            </p>
          </div>
        </DialogHeader>

        {/* Editor simple */}
        <div className="space-y-2">
          <TextareaWithCounter
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Escribe una nota…"
            className="min-h-[96px]"
          />
          <div className="flex items-center justify-end">
            <Button
              size="sm"
              onClick={addNote}
              disabled={createMut.isPending || !newNote.trim()}
            >
              {createMut.isPending ? "Agregando…" : "Agregar"}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Lista compacta */}
        <ScrollArea className="max-h-[45vh] pr-1">
          <div className="divide-y">
            {isPending ? (
              <p className="px-1 py-2 text-sm text-muted-foreground">
                Cargando notas…
              </p>
            ) : notes.length === 0 ? (
              <p className="px-1 py-2 text-sm text-muted-foreground">
                Aún no hay notas.
              </p>
            ) : (
              notes.map((n) => {
                const inEdit = editingId === n.id;
                return (
                  <div key={n.id} className="group flex gap-2 py-3">
                    {/* icono tenue opcional */}
                    <div className="mt-1 shrink-0 rounded-full bg-muted p-1">
                      <StickyNote className="h-3.5 w-3.5 opacity-70" />
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Cabecera: autor/fecha discretos */}
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <div className="mb-2 text-[11px] text-muted-foreground">
                          {n.labelCreatedBy && <span>{n.labelCreatedBy}</span>}
                          {n.labelCreatedBy && n.labelCreatedAt && (
                            <span className="mx-1">•</span>
                          )}
                          {n.labelCreatedAt && <span>{n.labelCreatedAt}</span>}
                        </div>

                        {/* acciones: ghost + solo visibles al hover */}
                        <div className="invisible group-hover:visible flex items-center gap-1">
                          {!inEdit && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                title="Editar"
                                onClick={() => startEdit(n.id, n.name)}
                                disabled={updateMut.isPending}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                title="Eliminar"
                                onClick={() => askDelete(n.id)}
                                disabled={inactivateMut.isPending}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Meta de actualización, muy sutil */}
                      {/* {(n.labelUpdatedBy || n.labelUpdatedAt) && (
                        <div className="mb-2 text-[11px] text-muted-foreground">
                          {n.labelUpdatedBy && <span>{n.labelUpdatedBy}</span>}
                          {n.labelUpdatedBy && n.labelUpdatedAt && (
                            <span className="mx-1">•</span>
                          )}
                          {n.labelUpdatedAt && <span>{n.labelUpdatedAt}</span>}
                        </div>
                      )} */}

                      {/* Cuerpo / Edición */}
                      {inEdit ? (
                        <div className="space-y-2">
                          <TextareaWithCounter
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            maxLength={1000}
                            rows={3}
                            placeholder="Editar nota…"
                            className="min-h-[88px]"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={saveEdit}
                              disabled={
                                updateMut.isPending || !editingText.trim()
                              }
                            >
                              Guardar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {n.name}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Confirmación */}
        <ConfirmModal
          open={confirm.open}
          title="Eliminar nota"
          message="¿Seguro que deseas eliminar esta nota?"
          onConfirm={doDelete}
          onCancel={() => setConfirm({ open: false })}
        />
      </DialogContent>
    </Dialog>
  );
}
