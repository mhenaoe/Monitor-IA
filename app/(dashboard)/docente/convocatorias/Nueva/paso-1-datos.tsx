"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  ArrowRight,
  GripVertical,
} from "lucide-react";
import type { Curso } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { crearConvocatoria } from "@/lib/actions/convocatorias";
import { cn } from "@/lib/utils";

interface Props {
  cursos: Curso[];
}

interface Pregunta {
  id: string;
  texto: string;
}

export function Paso1Datos({ cursos }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Estado del formulario
  const [cursoId, setCursoId] = useState<string>("");
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [preguntas, setPreguntas] = useState<Pregunta[]>([
    { id: crypto.randomUUID(), texto: "" },
  ]);
  const [error, setError] = useState<string | null>(null);

  // ─── Handlers de preguntas ───
  const agregarPregunta = () => {
    setPreguntas((prev) => [
      ...prev,
      { id: crypto.randomUUID(), texto: "" },
    ]);
  };

  const eliminarPregunta = (id: string) => {
    setPreguntas((prev) =>
      prev.length === 1 ? prev : prev.filter((p) => p.id !== id)
    );
  };

  const actualizarPregunta = (id: string, texto: string) => {
    setPreguntas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, texto } : p))
    );
  };

  // ─── Validación del cliente ───
  const validar = (): string | null => {
  if (!cursoId) return "Debes seleccionar un curso";
  if (!fechaInicio) return "Debes indicar la fecha de inicio";
  if (!fechaFin) return "Debes indicar la fecha de cierre";
  if (new Date(fechaInicio) >= new Date(fechaFin))
    return "La fecha de inicio debe ser anterior a la de cierre";
  if (new Date(fechaFin) <= new Date())
    return "La fecha de cierre debe ser futura";
  // Mínimo 1 pregunta con texto (alineado con el schema Zod)
  const conTexto = preguntas.filter((p) => p.texto.trim().length >= 5);
  if (conTexto.length === 0)
    return "Agrega al menos una pregunta (mínimo 5 caracteres)";
  if (preguntas.some((p) => p.texto.trim().length > 0 && p.texto.trim().length < 5))
    return "Cada pregunta debe tener al menos 5 caracteres";
  return null;
};

  // ─── Submit ───
  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const errorValidacion = validar();
  if (errorValidacion) {
    setError(errorValidacion);
    return;
  }
  setError(null);

  const preguntasFinales = preguntas
    .filter((p) => p.texto.trim() !== "")
    .map((p) => ({ pregunta: p.texto.trim(), tipo: "texto" as const }));

  // Bug 2: validar mínimo 1 pregunta con texto
  if (preguntasFinales.length === 0) {
    setError("Agrega al menos una pregunta para los postulantes");
    return;
  }

  const formData = new FormData();
  formData.append("cursoId", cursoId);
  formData.append("fechaInicio", fechaInicio);
  formData.append("fechaFin", fechaFin);
  formData.append("preguntasFase1", JSON.stringify(preguntasFinales));

  startTransition(async () => {
    const res = await crearConvocatoria(formData);
    if (res?.error) {
      setError(
        typeof res.error === "string" ? res.error : "Error al crear la convocatoria"
      );
      return;
    }
    if (res?.success && res.id) {
      router.push(`/docente/convocatorias/nueva?step=2&id=${res.id}`);
    }
  });
};

  // Fecha mínima: hoy (para el input date)
  const hoy = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ─── Sección: Curso y fechas ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Curso */}
        <div className="md:col-span-2">
          <Label htmlFor="curso">Curso</Label>
          <select
            id="curso"
            value={cursoId}
            onChange={(e) => setCursoId(e.target.value)}
            className={inputClasses}
            disabled={isPending}
          >
            <option value="">— Selecciona un curso —</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.codigo}) · {c.programa}
              </option>
            ))}
          </select>
          {cursos.length === 0 && (
            <p className="text-xs text-amber-600 mt-1.5">
              No hay cursos disponibles. Contacta al administrador.
            </p>
          )}
        </div>

        {/* Fecha inicio */}
        <div>
          <Label htmlFor="fechaInicio">Fecha de inicio</Label>
          <input
            id="fechaInicio"
            type="date"
            value={fechaInicio}
            min={hoy}
            onChange={(e) => setFechaInicio(e.target.value)}
            className={inputClasses}
            disabled={isPending}
          />
          <p className="text-[11px] text-gray-400 mt-1.5">
            Cuándo empieza a recibir postulaciones.
          </p>
        </div>

        {/* Fecha fin */}
        <div>
          <Label htmlFor="fechaFin">Fecha de cierre</Label>
          <input
            id="fechaFin"
            type="date"
            value={fechaFin}
            min={fechaInicio || hoy}
            onChange={(e) => setFechaFin(e.target.value)}
            className={inputClasses}
            disabled={isPending}
          />
          <p className="text-[11px] text-gray-400 mt-1.5">
            Después de esta fecha no se aceptan postulaciones.
          </p>
        </div>
      </div>

      {/* ─── Sección: Preguntas Fase 1 ─── */}
      <div className="pt-6 border-t border-gray-100">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Preguntas para los postulantes
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Preguntas abiertas que el estudiante responderá al postularse.
              Son opcionales.
            </p>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          {preguntas.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-100"
            >
              <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-400 w-6 text-center flex-shrink-0">
                {idx + 1}.
              </span>
              <input
                type="text"
                value={p.texto}
                onChange={(e) => actualizarPregunta(p.id, e.target.value)}
                placeholder="Ej: ¿Por qué quieres ser monitor de este curso?"
                className="flex-1 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50"
                disabled={isPending}
              />
              <button
                type="button"
                onClick={() => eliminarPregunta(p.id)}
                disabled={preguntas.length === 1 || isPending}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                aria-label="Eliminar pregunta"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={agregarPregunta}
          disabled={isPending}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Añadir pregunta
        </button>
      </div>

      {/* ─── Error global ─── */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Acciones ─── */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
        <Link
          href="/docente/convocatorias"
          className={cn(
            "text-sm text-gray-500 hover:text-gray-900 transition",
            isPending && "pointer-events-none opacity-50"
          )}
        >
          Cancelar
        </Link>

        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              Siguiente: Criterios
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Helpers de estilos ───

const inputClasses =
  "w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed";

function Label({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-semibold text-gray-900 mb-2"
    >
      {children}
    </label>
  );
}