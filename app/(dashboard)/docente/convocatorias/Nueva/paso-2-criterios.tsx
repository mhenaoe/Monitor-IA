"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Check,
  Send,
  Cpu,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import type { CriterioValidacion } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  eliminarCriterio,
  publicarConvocatoria,
} from "@/lib/actions/convocatorias";
import { CriterioForm } from "./criterio-form";
import { cn } from "@/lib/utils";

interface Props {
  convocatoriaId: string;
  criteriosExistentes: CriterioValidacion[];
}

export function Paso2Criterios({ convocatoriaId, criteriosExistentes }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mostrarForm, setMostrarForm] = useState(
    criteriosExistentes.length === 0
  );
  const [error, setError] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

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

  const handleGuardarBorrador = () => {
    router.push("/docente/convocatorias");
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
      const res = await publicarConvocatoria(convocatoriaId);
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
      {/* ─── Lista de criterios existentes ─── */}
      {criteriosExistentes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Criterios agregados ({criteriosExistentes.length})
            </h3>
          </div>

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
        </div>
      )}

      {/* ─── Formulario nuevo criterio / Botón añadir ─── */}
      {mostrarForm ? (
        <CriterioForm
          convocatoriaId={convocatoriaId}
          onSuccess={() => {
            setMostrarForm(false);
            router.refresh();
          }}
          onCancel={() => {
            if (criteriosExistentes.length > 0) setMostrarForm(false);
          }}
          puedeCancel={criteriosExistentes.length > 0}
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

      {/* ─── Info: mínimo 1 criterio para publicar ─── */}
      {criteriosExistentes.length === 0 && !error && (
        <div className="flex items-start gap-2 bg-amber-50 text-amber-800 text-sm px-4 py-3 rounded-lg border border-amber-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Debes agregar al menos un criterio para poder publicar la
            convocatoria.
          </span>
        </div>
      )}

      {/* ─── Acciones finales ─── */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
        <Link
          href={`/docente/convocatorias/nueva?step=1`}
          className={cn(
            "text-sm text-gray-500 hover:text-gray-900 transition",
            isPending && "pointer-events-none opacity-50"
          )}
        >
          ← Paso anterior
        </Link>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleGuardarBorrador}
            disabled={isPending}
          >
            <Check className="w-4 h-4" />
            Guardar como borrador
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handlePublicar}
            disabled={isPending || criteriosExistentes.length === 0}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Publicar ahora
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Card de criterio existente ───

interface CriterioCardProps {
  criterio: CriterioValidacion;
  onEliminar: () => void;
  eliminando: boolean;
}

function CriterioCard({ criterio, onEliminar, eliminando }: CriterioCardProps) {
  const esAutomatico = criterio.tipo === "AUTOMATICO_SIS";
  const Icon = esAutomatico ? Cpu : Pencil;

  // Descripción humana del criterio
  const descripcionRegla = construirDescripcion(criterio);

  return (
    <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition">
      {/* Icono de check + tipo */}
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

      {/* Contenido */}
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
        <p className="text-xs text-gray-500 mt-0.5">{descripcionRegla}</p>
      </div>

      {/* Eliminar */}
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
  // Manual
  const op = operadorTexto[criterio.operador] ?? criterio.operador;
  return `Respuesta esperada: ${op.toLowerCase()} "${criterio.valor}"`;
}