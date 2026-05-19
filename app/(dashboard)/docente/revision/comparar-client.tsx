"use client";

import { useState } from "react";
import {
  GraduationCap,
  Star,
  TrendingUp,
  BookOpen,
  X,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Candidato {
  id: string;
  estado: string;
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
  candidatos: Candidato[];
}

export function CompararCandidatos({ candidatos }: Props) {
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [comparando, setComparando] = useState(false);

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= 3) return prev; // máximo 3
      return [...prev, id];
    });
  };

  const candidatosSeleccionados = candidatos.filter((c) =>
    seleccionados.includes(c.id)
  );

  if (comparando && candidatosSeleccionados.length >= 2) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Comparando {candidatosSeleccionados.length} candidatos
          </h3>
          <button
            onClick={() => { setComparando(false); setSeleccionados([]); }}
            className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Cerrar comparación
          </button>
        </div>

        <div className={cn(
          "grid gap-4",
          candidatosSeleccionados.length === 2 ? "grid-cols-2" : "grid-cols-3"
        )}>
          {candidatosSeleccionados.map((c) => {
            const iniciales = `${c.estudiante.nombre[0]}${c.estudiante.apellido[0]}`.toUpperCase();
            const esMejorPromedio = candidatosSeleccionados.every(
              (otro) => otro.id === c.id || otro.estudiante.promedioAcumulado <= c.estudiante.promedioAcumulado
            );
            const esMayorSemestre = candidatosSeleccionados.every(
              (otro) => otro.id === c.id || otro.estudiante.semestre <= c.estudiante.semestre
            );

            return (
              <div key={c.id} className="rounded-xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
                    {iniciales}
                  </div>
                  <p className="text-white font-semibold text-sm">
                    {c.estudiante.nombre} {c.estudiante.apellido}
                  </p>
                  <p className="text-violet-200 text-xs mt-0.5">{c.estudiante.correo}</p>
                </div>

                {/* Métricas */}
                <div className="p-4 space-y-3">
                  <Metrica
                    icono={Star}
                    label="Promedio"
                    valor={c.estudiante.promedioAcumulado.toFixed(2)}
                    destacado={esMejorPromedio}
                    color="violet"
                  />
                  <Metrica
                    icono={TrendingUp}
                    label="Semestre"
                    valor={c.estudiante.semestre.toString()}
                    destacado={esMayorSemestre}
                    color="emerald"
                  />
                  <Metrica
                    icono={BookOpen}
                    label="Programa"
                    valor={c.estudiante.programa.replace("Ingeniería de ", "Ing. ")}
                    destacado={false}
                    color="gray"
                  />
                  <Metrica
                    icono={BarChart2}
                    label="Score IA"
                    valor={c.puntajeIA ? c.puntajeIA.toFixed(1) : "—"}
                    destacado={false}
                    color="gray"
                  />

                  {/* Estado */}
                  <div className="pt-2 border-t border-gray-100">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      c.estado === "ACEPTADO" && "bg-emerald-100 text-emerald-700",
                      c.estado === "DENEGADO" && "bg-red-100 text-red-600",
                      c.estado === "APROBADA_FASE_1" && "bg-violet-100 text-violet-700",
                      c.estado === "APROBADA_FASE_2" && "bg-blue-100 text-blue-700",
                    )}>
                      {c.estado.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Selecciona 2 o 3 candidatos para comparar
        </p>
        {seleccionados.length >= 2 && (
          <button
            onClick={() => setComparando(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition font-medium"
          >
            <BarChart2 className="w-4 h-4" />
            Comparar ({seleccionados.length})
          </button>
        )}
      </div>

      <div className="space-y-2">
        {candidatos.map((c) => {
          const seleccionado = seleccionados.includes(c.id);
          const iniciales = `${c.estudiante.nombre[0]}${c.estudiante.apellido[0]}`.toUpperCase();

          return (
            <button
              key={c.id}
              onClick={() => toggleSeleccion(c.id)}
              disabled={!seleccionado && seleccionados.length >= 3}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                seleccionado
                  ? "border-violet-300 bg-violet-50"
                  : "border-gray-100 hover:border-gray-200",
                !seleccionado && seleccionados.length >= 3 && "opacity-40 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                seleccionado
                  ? "bg-violet-500"
                  : "bg-gradient-to-br from-violet-500 to-purple-600"
              )}>
                {seleccionado ? "✓" : iniciales}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {c.estudiante.nombre} {c.estudiante.apellido}
                </p>
                <p className="text-xs text-gray-500">
                  Semestre {c.estudiante.semestre} · Promedio {c.estudiante.promedioAcumulado.toFixed(2)}
                </p>
              </div>
              {seleccionado && (
                <span className="text-xs font-semibold text-violet-600 flex-shrink-0">
                  #{seleccionados.indexOf(c.id) + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Metrica({
  icono: Icon,
  label,
  valor,
  destacado,
  color,
}: {
  icono: React.ComponentType<{ className?: string }>;
  label: string;
  valor: string;
  destacado: boolean;
  color: "violet" | "emerald" | "gray";
}) {
  return (
    <div className={cn(
      "flex items-center justify-between p-2 rounded-lg",
      destacado && color === "violet" && "bg-violet-50",
      destacado && color === "emerald" && "bg-emerald-50",
    )}>
      <div className="flex items-center gap-2">
        <Icon className={cn(
          "w-3.5 h-3.5",
          destacado && color === "violet" && "text-violet-500",
          destacado && color === "emerald" && "text-emerald-500",
          !destacado && "text-gray-400",
        )} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <span className={cn(
        "text-sm font-semibold",
        destacado && color === "violet" && "text-violet-700",
        destacado && color === "emerald" && "text-emerald-700",
        !destacado && "text-gray-700",
      )}>
        {valor}
        {destacado && " ★"}
      </span>
    </div>
  );
}
