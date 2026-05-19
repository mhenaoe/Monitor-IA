"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Inbox,
  GraduationCap,
} from "lucide-react";
import type { EstadoPostulacion } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConvocatoriaCard {
  id: string;
  cursoNombre: string;
  cursoCodigo: string;
  programa: string;
  semestre: string;
  fechaInicio: Date;
  fechaFin: Date;
  docenteNombre: string;
  totalCriterios: number;
  totalPostulaciones: number;
  miPostulacion: {
    id: string;
    estado: EstadoPostulacion;
    faseActual: string;
  } | null;
}

interface Props {
  convocatorias: ConvocatoriaCard[];
}

// Variants aceptados por Badge (extraídos del componente)
type BadgeVariant =
  | "default"
  | "borrador"
  | "publicada"
  | "cerrada"
  | "aceptado"
  | "rechazada"
  | "info"
  | "warning";

export function MuralClient({ convocatorias }: Props) {
  const [busqueda, setBusqueda] = useState("");

  const filtradas = useMemo(() => {
    if (!busqueda.trim()) return convocatorias;
    const q = busqueda.toLowerCase();
    return convocatorias.filter(
      (c) =>
        c.cursoNombre.toLowerCase().includes(q) ||
        c.cursoCodigo.toLowerCase().includes(q) ||
        c.docenteNombre.toLowerCase().includes(q)
    );
  }, [convocatorias, busqueda]);

  if (convocatorias.length === 0) {
    return <EstadoVacio />;
  }

  return (
    <div className="space-y-5">
      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por curso, código o docente..."
          className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-gray-400"
        />
      </div>

      {/* Grid de cards */}
      {filtradas.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-500">
          No se encontraron convocatorias que coincidan con{" "}
          <span className="font-medium text-gray-700">
            &ldquo;{busqueda}&rdquo;
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtradas.map((conv) => (
            <ConvocatoriaCardItem key={conv.id} conv={conv} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Card individual ───

function ConvocatoriaCardItem({ conv }: { conv: ConvocatoriaCard }) {
  const diasRestantes = calcularDiasRestantes(conv.fechaFin);
  const esUrgente = diasRestantes <= 3 && diasRestantes >= 0;
  const estadoPostulacion = conv.miPostulacion?.estado;

  return (
    <Link
      href={`/estudiante/mural/${conv.id}`}
      className={cn(
        "group flex flex-col bg-white rounded-2xl border border-gray-100 p-5",
        "hover:border-violet-200 hover:shadow-md hover:shadow-violet-100/50 transition-all",
        estadoPostulacion && "border-violet-200 bg-violet-50/20"
      )}
    >
      {/* Top: badge estado (si ya postuló) + urgencia */}
      <div className="flex items-center justify-between mb-3 min-h-[20px]">
        {estadoPostulacion ? (
          <EstadoBadge estado={estadoPostulacion} />
        ) : (
          <div />
        )}
        {esUrgente && !estadoPostulacion && (
          <Badge variant="warning">
            <Clock className="w-3 h-3 inline mr-1" />
            {diasRestantes === 0
              ? "Último día"
              : `${diasRestantes}d restantes`}
          </Badge>
        )}
      </div>

      {/* Curso */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-violet-600 uppercase tracking-wider mb-1">
          <GraduationCap className="w-3.5 h-3.5" />
          {conv.cursoCodigo}
        </div>
        <h3 className="font-bold text-gray-900 text-base leading-tight">
          {conv.cursoNombre}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {conv.docenteNombre} · {conv.semestre}
        </p>
      </div>

      {/* Info secundaria */}
      <div className="space-y-1.5 text-xs text-gray-600 mb-4">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span>
            Cierra el <strong>{formatearFecha(conv.fechaFin)}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <span>
            <strong>{conv.totalPostulaciones}</strong>{" "}
            {conv.totalPostulaciones === 1 ? "postulado" : "postulados"}
            {conv.totalCriterios > 0 && (
              <>
                {" · "}
                <strong>{conv.totalCriterios}</strong>{" "}
                {conv.totalCriterios === 1 ? "requisito" : "requisitos"}
              </>
            )}
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
        <span
          className={cn(
            "text-xs font-semibold",
            estadoPostulacion ? "text-violet-700" : "text-gray-700"
          )}
        >
          {estadoPostulacion ? "Ver mi postulación" : "Ver detalles"}
        </span>
        <ArrowRight
          className={cn(
            "w-4 h-4 transition-transform group-hover:translate-x-1",
            estadoPostulacion ? "text-violet-600" : "text-gray-400"
          )}
        />
      </div>
    </Link>
  );
}

// ─── Badge de estado de postulación ───

interface EstadoConfig {
  variant: BadgeVariant;
  label: string;
  Icon: typeof CheckCircle2;
}

const ESTADO_MAP: Record<EstadoPostulacion, EstadoConfig> = {
  EN_PROCESO: { variant: "info", label: "En proceso", Icon: Clock },
  APROBADA_FASE_1: { variant: "info", label: "Fase 1 aprobada", Icon: CheckCircle2 },
  APROBADA_FASE_2: { variant: "info", label: "Fase 2 aprobada", Icon: CheckCircle2 },
  ACEPTADO: { variant: "aceptado", label: "Elegido", Icon: CheckCircle2 },
  DENEGADO: { variant: "rechazada", label: "No seleccionado", Icon: XCircle },
  RECHAZADA: { variant: "rechazada", label: "No cumple requisitos", Icon: XCircle },
};

function EstadoBadge({ estado }: { estado: EstadoPostulacion }) {
  const config = ESTADO_MAP[estado];
  const Icon = config.Icon;

  return (
    <Badge variant={config.variant}>
      <Icon className="w-3 h-3 inline mr-1" />
      {config.label}
    </Badge>
  );
}

// ─── Estado vacío ───

function EstadoVacio() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
          <Inbox className="h-7 w-7 text-violet-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">
          No hay convocatorias activas
        </h3>
        <p className="mt-1 text-sm text-gray-500 max-w-sm">
          Aún no hay monitorías abiertas para tu programa. Vuelve pronto para
          descubrir nuevas oportunidades.
        </p>
      </div>
    </div>
  );
}

// ─── Helpers ───

function formatearFecha(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function calcularDiasRestantes(fechaFin: Date | string): number {
  const fin = typeof fechaFin === "string" ? new Date(fechaFin) : fechaFin;
  const hoy = new Date();
  const diff = fin.getTime() - hoy.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}