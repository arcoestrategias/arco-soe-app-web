"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { useState } from "react";
import type { Nota } from "../types";

interface SectionNotesProps {
  titulo: string;
  notas: Nota[];
  onNotasChange: (notas: Nota[]) => void;
  readonly?: boolean;
}

export function SectionNotes({
  titulo,
  notas,
  onNotasChange,
  readonly = false,
}: SectionNotesProps) {
  const [nuevoTexto, setNuevoTexto] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [textoEditando, setTextoEditando] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);

  const agregarNota = () => {
    if (!nuevoTexto.trim() || readonly) return;
    const nota: Nota = {
      id: crypto.randomUUID(),
      contenido: nuevoTexto.trim(),
      fechaCreacion: new Date().toISOString(),
      creadoPor: "Usuario Actual",
    };
    onNotasChange([nota, ...notas]);
    setNuevoTexto("");
    setMostrarForm(false);
  };

  const guardarEdicion = () => {
    if (!textoEditando.trim() || readonly) return;
    const actualizadas = notas.map((n) =>
      n.id === editandoId
        ? {
            ...n,
            contenido: textoEditando,
            fechaModificacion: new Date().toISOString(),
            modificadoPor: "Usuario Actual",
          }
        : n
    );
    onNotasChange(actualizadas);
    setEditandoId(null);
    setTextoEditando("");
  };

  const eliminarNota = (id: string) => {
    if (readonly) return;
    onNotasChange(notas.filter((n) => n.id !== id));
  };

  const formatear = (iso: string) =>
    new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(new Date(iso));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {titulo}
          </CardTitle>
          {!readonly && !mostrarForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Nota
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mostrarForm && !readonly && (
          <div className="space-y-3 border p-4 bg-gray-50 rounded-lg">
            <Textarea
              value={nuevoTexto}
              onChange={(e) => setNuevoTexto(e.target.value)}
              placeholder="Escribe tu nota aquí..."
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNuevoTexto("");
                  setMostrarForm(false);
                }}
              >
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
              <Button
                size="sm"
                onClick={agregarNota}
                disabled={!nuevoTexto.trim()}
              >
                <Save className="h-4 w-4 mr-1" /> Guardar
              </Button>
            </div>
          </div>
        )}

        {notas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="mx-auto h-8 w-8 mb-2" />
            <p>No hay notas registradas</p>
          </div>
        ) : (
          notas.map((nota) => (
            <div
              key={nota.id}
              className="p-4 border rounded-lg hover:bg-gray-50"
            >
              {editandoId === nota.id ? (
                <div className="space-y-3">
                  <Textarea
                    value={textoEditando}
                    onChange={(e) => setTextoEditando(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditandoId(null)}
                    >
                      <X className="h-4 w-4 mr-1" /> Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={guardarEdicion}
                      disabled={!textoEditando.trim()}
                    >
                      <Save className="h-4 w-4 mr-1" /> Guardar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{nota.creadoPor}</Badge>
                      <span>{formatear(nota.fechaCreacion)}</span>
                      {nota.fechaModificacion && (
                        <Badge variant="secondary">Editado</Badge>
                      )}
                    </div>
                    {!readonly && (
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            setEditandoId(nota.id);
                            setTextoEditando(nota.contenido);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-600 hover:text-red-700"
                          onClick={() => eliminarNota(nota.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {nota.contenido}
                  </p>
                </>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
