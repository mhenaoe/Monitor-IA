"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  FileText,
  Check,
  X,
  ChevronDown,
  AlertCircle,
  Loader2,
  Inbox,
  GraduationCap,
  Info,
} from "lucide-react";
import type { EstadoConvocatoria, EstadoPostulacion } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { actualizarEstadoCandidato } from "@/lib/actions/postulaciones";
import { cn } from "@/lib/utils";

interface ConvocatoriaResumen {
  id: string;
  cursoNombre: string;
  cursoCodigo: string;
  estado: EstadoConvocatoria;
  totalPostulaciones: number;
}

interface Candidato {
  id: string;
  estado: EstadoPostulacion;
  faseActual: string;
  fechaPostulacion: Date;
  puntajeIA: number | null;
  estudiante: {
    id: string;
    nombre: string;
    apellido: string;
    correo: string;
    programa: string;
    semestre: number;
    promedioAcumulado: number;
  };
}

interface Props {
  convocatorias: ConvocatoriaResumen[];
  convocatoriaActivaId: string;
  candidatos: Candidato[];
}

export function RevisionClient({
  convocatorias,
  convocatoriaActivaId,
  candidatos,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);

  // ─── Filtrar candidatos por búsqueda ───
  const candidatosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return candidatos;
    const q = busqueda.toLowerCase();
    return candidatos.filter(
      (c) =>
        c.estudiante.nombre.toLowerCase().includes(q) ||
        c.estudiante.apellido.toLowerCase().includes(q) ||
        c.estudiante.correo.toLowerCase().includes(q)
    );
  }, [candidatos, busqueda]);

  // ─── Cambiar convocatoria ───
  const handleCambiarConvocatoria = (nuevoId: string) => {
    router.push(`/docente/revision?convocatoria=${nuevoId}`);
  };

  // ─── Aceptar / Rechazar candidato ───
  const handleActualizar = (
    id: string,
    nuevoEstado: "ACEPTADO" | "DENEGADO"
  ) => {
    const mensaje =
      nuevoEstado === "ACEPTADO"
        ? "¿Elegir a este candidato como monitor? Se le notificará por correo."
        : "¿Rechazar a este candidato? Se le notificará por correo.";
    if (!confirm(mensaje)) return;

    setProcesando(id);
    setError(null);
    startTransition(async () => {
      const res = await actualizarEstadoCandidato(id, nuevoEstado);
      setProcesando(null);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* ─── Barra superior: Selector + Buscar + Ranking IA ─── */}
      <div className="space-y-4">
        {/* Selector de convocatoria */}
        {convocatorias.length > 1 && (
          <SelectorConvocatoria
            convocatorias={convocatorias}
            activaId={convocatoriaActivaId}
            onCambiar={handleCambiarConvocatoria}
            disabled={isPending}
          />
        )}

        {/* Ranking IA + Buscar en la misma línea */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <RankingInfo />
          <BuscadorCandidatos
            valor={busqueda}
            onChange={setBusqueda}
            disabled={isPending}
          />
        </div>
      </div>

      {/* ─── Lista de candidatos ─── */}
      {candidatos.length === 0 ? (
        <EstadoSinCandidatos />
      ) : candidatosFiltrados.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-500">
          No se encontraron candidatos que coincidan con{" "}
          <span className="font-medium text-gray-700">&ldquo;{busqueda}&rdquo;</span>
        </div>
      ) : (
        <div className="space-y-3">
          {candidatosFiltrados.map((candidato, idx) => (
            <CandidatoCard
              key={candidato.id}
              candidato={candidato}
              posicion={idx + 1}
              onAceptar={() => handleActualizar(candidato.id, "ACEPTADO")}
              onRechazar={() => handleActualizar(candidato.id, "DENEGADO")}
              procesando={procesando === candidato.id}
              disabled={isPending}
            />
          ))}
        </div>
      )}

      {/* ─── Error global ─── */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// ─── Card individual de candidato ───

interface CandidatoCardProps {
  candidato: Candidato;
  posicion: number;
  onAceptar: () => void;
  onRechazar: () => void;
  procesando: boolean;
  disabled: boolean;
}

function CandidatoCard({
  candidato,
  posicion,
  onAceptar,
  onRechazar,
  procesando,
  disabled,
}: CandidatoCardProps) {
  const { estudiante, estado } = candidato;
  const iniciales = `${estudiante.nombre[0] ?? ""}${
    estudiante.apellido[0] ?? ""
  }`.toUpperCase();

  // Estado final (aceptado/denegado) vs activo
  const estaFinalizado = estado === "ACEPTADO" || estado === "DENEGADO";
  const esAceptado = estado === "ACEPTADO";

  // Programa acortado
  const programaCorto = acortarPrograma(estudiante.programa);

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 bg-white rounded-xl border transition-all",
        estaFinalizado
          ? esAceptado
            ? "border-emerald-200 bg-emerald-50/30"
            : "border-red-100 bg-red-50/20 opacity-70"
          : "border-gray-100 hover:border-gray-200"
      )}
    >
      {/* Avatar con iniciales */}
      <div className="relative flex-shrink-0">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm",
            "bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/30"
          )}
        >
          {iniciales}
        </div>
        {/* Numerito de posición */}
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
          {posicion}
        </div>
      </div>

      {/* Info del estudiante */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 text-sm">
            {estudiante.nombre} {estudiante.apellido}
          </span>
          {estaFinalizado && (
            <Badge variant={esAceptado ? "aceptado" : "rechazada"}>
              {esAceptado ? "Elegido" : "Rechazado"}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
          <span>{programaCorto}</span>
          <span className="text-gray-300">•</span>
          <span>Semestre {estudiante.semestre}</span>
          <span className="text-gray-300">•</span>
          <span className="font-medium text-gray-700">
            Promedio {estudiante.promedioAcumulado.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Score IA (placeholder R2) */}
      <div className="hidden sm:block text-right flex-shrink-0">
        <div className="flex items-center justify-end gap-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          <Sparkles className="w-3 h-3" />
          Score IA
        </div>
        <div className="text-lg font-bold text-gray-300 leading-tight" title="Disponible en Release 2">
          —
        </div>
      </div>

      {/* Botones HV + Acciones */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* HV: deshabilitado en R1 */}
        <button
          type="button"
          disabled
          title="Hoja de vida disponible en Release 2"
          className="px-3 py-2 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-lg cursor-not-allowed inline-flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" />
          HV
        </button>

        {/* Acciones según estado */}
        {!estaFinalizado && (
          <>
            <button
              type="button"
              onClick={onRechazar}
              disabled={disabled || procesando}
              className={cn(
                "px-3 py-2 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5",
                "text-red-700 bg-red-50 hover:bg-red-100 border border-red-200",
                "disabled:opacity-50 disabled:pointer-events-none"
              )}
              aria-label="Rechazar candidato"
            >
              {procesando ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              Rechazar
            </button>

            <button
              type="button"
              onClick={onAceptar}
              disabled={disabled || procesando}
              className={cn(
                "px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-1.5",
                "text-white bg-gradient-to-r from-violet-600 to-purple-600",
                "hover:from-violet-700 hover:to-purple-700",
                "shadow-sm hover:shadow-md shadow-violet-500/20",
                "disabled:opacity-50 disabled:pointer-events-none"
              )}
              aria-label="Elegir candidato"
            >
              {procesando ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Elegir
            </button>
          </>
        )}

        {estaFinalizado && (
          <div className="text-xs text-gray-400 italic px-3">
            {esAceptado ? "Seleccionado" : "No seleccionado"}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Selector de convocatoria ───

interface SelectorProps {
  convocatorias: ConvocatoriaResumen[];
  activaId: string;
  onCambiar: (id: string) => void;
  disabled: boolean;
}

function SelectorConvocatoria({
  convocatorias,
  activaId,
  onCambiar,
  disabled,
}: SelectorProps) {
  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        Convocatoria
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
            "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          )}
        >
          {convocatorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.cursoNombre} · {c.cursoCodigo} ({c.totalPostulaciones}{" "}
              {c.totalPostulaciones === 1 ? "postulante" : "postulantes"})
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ─── Ranking IA info ───

function RankingInfo() {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span>Ordenado por</span>
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-violet-50 text-violet-700 font-medium">
        <Sparkles className="w-3 h-3" />
        MonitorIA
      </span>
      <button
        type="button"
        title="El ranking con IA estará disponible en Release 2. Actualmente se ordena por fecha de postulación."
        className="text-gray-400 hover:text-gray-600 transition"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Buscador ───

interface BuscadorProps {
  valor: string;
  onChange: (v: string) => void;
  disabled: boolean;
}

function BuscadorCandidatos({ valor, onChange, disabled }: BuscadorProps) {
  return (
    <div className="relative w-full sm:w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Buscar por nombre..."
        className={cn(
          "w-full pl-9 pr-3 py-2 text-sm",
          "bg-white border border-gray-200 rounded-lg",
          "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent",
          "placeholder:text-gray-400",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      />
    </div>
  );
}

// ─── Estado sin candidatos ───

function EstadoSinCandidatos() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
        <Inbox className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900">
        Aún no hay candidatos
      </h3>
      <p className="mt-1 text-xs text-gray-500 max-w-xs">
        Los estudiantes que cumplan los criterios aparecerán aquí cuando se
        postulen.
      </p>
    </div>
  );
}

// ─── Helper: acortar nombres de programa ───

function acortarPrograma(programa: string): string {
  const abreviaciones: Record<string, string> = {
    "Ingeniería de Sistemas": "Ing. Sistemas",
    "Ingeniería Industrial": "Ing. Industrial",
    "Ingeniería Civil": "Ing. Civil",
    "Ingeniería Electrónica": "Ing. Electrónica",
    "Ingeniería Mecánica": "Ing. Mecánica",
    "Ingeniería Ambiental": "Ing. Ambiental",
  };
  return abreviaciones[programa] ?? programa;
}