"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Cpu,
  Pencil,
  CheckCircle2,
  ChevronDown,
  Send,
} from "lucide-react";
import type { CriterioValidacion } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  eliminarCriterio,
  publicarConvocatoria,
} from "@/lib/actions/convocatorias";
import { CriterioForm } from "../convocatorias/nueva/criterio-form";
import { cn } from "@/lib/utils";

interface BorradorResumen {
  id: string;
  cursoNombre: string;
  cursoCodigo: string;
  totalCriterios: number;
}

interface Props {
  borradores: BorradorResumen[];
  convocatoriaActivaId: string;
  criteriosExistentes: CriterioValidacion[];
}

export function CriteriosClient({
  borradores,
  convocatoriaActivaId,
  criteriosExistentes,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const activa = borradores.find((b) => b.id === convocatoriaActivaId);

  const handleCambiarConvocatoria = (nuevoId: string) => {
    router.push(`/docente/criterios?convocatoria=${nuevoId}`);
  };

  const handleEliminar = (id: string) => {
    if (!confirm("¿Eliminar este criterio?")) return;
    setEliminando(id);
    setError(null);
    startTransition(async () => {
      const res = await eliminarCriterio(id);
      setEliminando(null);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  const handlePublicar = () => {
    if (criteriosExistentes.length === 0) {
      setError("Agrega al menos un criterio antes de publicar");
      return;
    }
    if (
      !confirm(
        "¿Publicar esta convocatoria? Se notificará a todos los estudiantes del programa."
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await publicarConvocatoria(convocatoriaActivaId);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.push("/docente/convocatorias");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* ─── Selector de convocatoria ─── */}
      {borradores.length > 1 ? (
        <SelectorConvocatoria
          borradores={borradores}
          activaId={convocatoriaActivaId}
          onCambiar={handleCambiarConvocatoria}
          disabled={isPending}
        />
      ) : activa ? (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="uppercase tracking-wider font-semibold">
            Editando:
          </span>
          <span className="font-medium text-gray-900 normal-case tracking-normal">
            {activa.cursoNombre} · {activa.cursoCodigo}
          </span>
          <Badge variant="borrador">Borrador</Badge>
        </div>
      ) : null}

      {/* ─── Lista de criterios ─── */}
      {criteriosExistentes.length > 0 ? (
        <div className="space-y-2">
          {criteriosExistentes.map((criterio) => (
            <CriterioCard
              key={criterio.id}
              criterio={criterio}
              onEliminar={() => handleEliminar(criterio.id)}
              eliminando={eliminando === criterio.id}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-start gap-2 bg-amber-50 text-amber-800 text-sm px-4 py-3 rounded-lg border border-amber-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Esta convocatoria aún no tiene criterios. Agrega al menos uno para
            poder publicarla.
          </span>
        </div>
      )}

      {/* ─── Form nuevo criterio / Botón añadir ─── */}
      {mostrarForm ? (
        <CriterioForm
          convocatoriaId={convocatoriaActivaId}
          onSuccess={() => {
            setMostrarForm(false);
            router.refresh();
          }}
          onCancel={() => setMostrarForm(false)}
          puedeCancel={true}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setMostrarForm(true);
            setError(null);
          }}
          disabled={isPending}
          className={cn(
            "w-full flex flex-col items-center justify-center gap-2",
            "py-8 px-6 rounded-xl border-2 border-dashed border-gray-200",
            "hover:border-violet-300 hover:bg-violet-50/30 transition-all",
            "text-gray-500 hover:text-violet-700",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-medium">Añadir Nuevo Filtro</span>
        </button>
      )}

      {/* ─── Error global ─── */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Acción publicar (si tiene criterios) ─── */}
      {criteriosExistentes.length > 0 && (
        <div className="flex items-center justify-end pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="primary"
            onClick={handlePublicar}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Publicar convocatoria
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Selector de convocatoria (dropdown) ───

interface SelectorProps {
  borradores: BorradorResumen[];
  activaId: string;
  onCambiar: (id: string) => void;
  disabled: boolean;
}

function SelectorConvocatoria({
  borradores,
  activaId,
  onCambiar,
  disabled,
}: SelectorProps) {
  const activa = borradores.find((b) => b.id === activaId);
  if (!activa) return null;

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        Convocatoria en borrador
      </label>
      <div className="relative">
        <select
          value={activaId}
          onChange={(e) => onCambiar(e.target.value)}
          disabled={disabled}
          className={cn(
            "w-full appearance-none bg-white border border-gray-200 rounded-lg",
            "px-3.5 py-2.5 pr-10 text-sm text-gray-900 font-medium",
            "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "cursor-pointer"
          )}
        >
          {borradores.map((b) => (
            <option key={b.id} value={b.id}>
              {b.cursoNombre} · {b.cursoCodigo} ({b.totalCriterios}{" "}
              {b.totalCriterios === 1 ? "criterio" : "criterios"})
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ─── Card de criterio (reutilizada del wizard) ───

interface CriterioCardProps {
  criterio: CriterioValidacion;
  onEliminar: () => void;
  eliminando: boolean;
}

function CriterioCard({ criterio, onEliminar, eliminando }: CriterioCardProps) {
  const esAutomatico = criterio.tipo === "AUTOMATICO_SIS";
  const Icon = esAutomatico ? Cpu : Pencil;
  const descripcion = construirDescripcion(criterio);

  return (
    <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition">
      <div
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
          esAutomatico
            ? "bg-violet-50 text-violet-600"
            : "bg-teal-50 text-teal-600"
        )}
      >
        <CheckCircle2 className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 text-sm">
            {criterio.nombre}
          </span>
          <Badge variant={esAutomatico ? "publicada" : "info"}>
            <Icon className="w-3 h-3 mr-1 inline" />
            {esAutomatico ? "Automático SIS" : "Manual"}
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{descripcion}</p>
      </div>

      <button
        type="button"
        onClick={onEliminar}
        disabled={eliminando}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        aria-label="Eliminar criterio"
      >
        {eliminando ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

// ─── Helper: texto humano del criterio ───

function construirDescripcion(criterio: CriterioValidacion): string {
  const operadorTexto: Record<string, string> = {
    ">=": "Mayor o igual a",
    "<=": "Menor o igual a",
    "==": "Igual a",
    "!=": "Diferente de",
    ">": "Mayor que",
    "<": "Menor que",
  };

  const campoTexto: Record<string, string> = {
    promedioAcumulado: "Promedio acumulado",
    semestre: "Semestre",
    creditosAprobados: "Créditos aprobados",
  };

  if (criterio.tipo === "AUTOMATICO_SIS") {
    const campo = campoTexto[criterio.campo] ?? criterio.campo;
    const op = operadorTexto[criterio.operador] ?? criterio.operador;
    return `Requisito de sistema: ${campo} ${op.toLowerCase()} ${criterio.valor}`;
  }
  const op = operadorTexto[criterio.operador] ?? criterio.operador;
  return `Respuesta esperada: ${op.toLowerCase()} "${criterio.valor}"`;
}