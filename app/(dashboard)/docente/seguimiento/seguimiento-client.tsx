"use client";

import { useState, useTransition } from "react";
import { registrarInformeSeguimiento } from "@/lib/actions/seguimiento";
import {
  BarChart3,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  Star,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Monitoria {
  id: string;
  semestreActivo: string;
  estado: string;
  horasTotales: number;
  fechaInicio: string;
  curso: { nombre: string; codigo: string };
  monitor: { nombre: string; apellido: string; correo: string };
  registrosHoras: {
    id: string;
    fecha: string;
    horasRegistradas: number;
    descripcion: string;
    estado: string;
  }[];
  informesSeguimiento: {
    id: string;
    semana: number;
    fecha: string;
    contenido: string;
    calificacionDesempeno: number;
    observaciones: string | null;
  }[];
  evidencias: {
    id: string;
    tipo: string;
    archivoUrl: string;
    fechaSubida: string;
    descripcion: string | null;
  }[];
}

interface Props {
  monitorias: Monitoria[];
}

export function SeguimientoClient({ monitorias }: Props) {
  const [monitoriaActivaId, setMonitoriaActivaId] = useState(monitorias[0]?.id ?? "");
  const [tab, setTab] = useState<"informes" | "horas" | "evidencias">("informes");
  const [expandida, setExpandida] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const monitoria = monitorias.find((m) => m.id === monitoriaActivaId)!;
  const horasSemana = monitoria.registrosHoras
    .filter((r) => {
      const fecha = new Date(r.fecha);
      const hoy = new Date();
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - hoy.getDay());
      return fecha >= inicioSemana;
    })
    .reduce((acc, r) => acc + r.horasRegistradas, 0);

  function handleSubmitInforme(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("monitoriaId", monitoriaActivaId);

    startTransition(async () => {
      const res = await registrarInformeSeguimiento(formData);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setMostrarFormulario(false);
        form.reset();
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Selector de monitoría */}
      {monitorias.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {monitorias.map((m) => (
            <button
              key={m.id}
              onClick={() => setMonitoriaActivaId(m.id)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg border transition-all",
                m.id === monitoriaActivaId
                  ? "bg-violet-500 text-white border-violet-500 font-medium shadow-sm shadow-violet-500/30"
                  : "border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600"
              )}
            >
              {m.curso.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Tarjeta resumen del monitor */}
      <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-violet-50 to-purple-50 p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-1">
              Monitor asignado
            </p>
            <h2 className="text-lg font-bold text-gray-900">
              {monitoria.monitor.nombre} {monitoria.monitor.apellido}
            </h2>
            <p className="text-sm text-gray-500">{monitoria.monitor.correo}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {monitoria.curso.nombre} · {monitoria.curso.codigo}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="text-center bg-white rounded-xl px-4 py-2 border border-gray-100 shadow-sm">
              <p className="text-2xl font-bold text-violet-600">{monitoria.horasTotales}</p>
              <p className="text-xs text-gray-500">Horas totales</p>
            </div>
            <div className="text-center bg-white rounded-xl px-4 py-2 border border-gray-100 shadow-sm">
              <p className="text-2xl font-bold text-emerald-500">{horasSemana}</p>
              <p className="text-xs text-gray-500">Esta semana</p>
            </div>
            <div className="text-center bg-white rounded-xl px-4 py-2 border border-gray-100 shadow-sm">
              <p className="text-2xl font-bold text-gray-700">{monitoria.informesSeguimiento.length}</p>
              <p className="text-xs text-gray-500">Informes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {(["informes", "horas", "evidencias"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium capitalize transition-all border-b-2 -mb-px",
              tab === t
                ? "border-violet-500 text-violet-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {t === "informes" ? "Informes semanales" : t === "horas" ? "Registro de horas" : "Evidencias"}
          </button>
        ))}
      </div>

      {/* Tab: Informes */}
      {tab === "informes" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {monitoria.informesSeguimiento.length} informe{monitoria.informesSeguimiento.length !== 1 ? "s" : ""} registrado{monitoria.informesSeguimiento.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors font-medium"
            >
              <FileText className="w-4 h-4" />
              Nuevo informe
            </button>
          </div>

          {/* Formulario */}
          {mostrarFormulario && (
            <form onSubmit={handleSubmitInforme} className="rounded-xl border border-violet-100 bg-violet-50/50 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Registrar informe semanal</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Semana #</label>
                  <input
                    name="semana"
                    type="number"
                    min={1}
                    max={20}
                    required
                    placeholder="Ej: 4"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Calificación (0–5)</label>
                  <input
                    name="calificacionDesempeno"
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    required
                    placeholder="Ej: 4.5"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Contenido del informe</label>
                <textarea
                  name="contenido"
                  required
                  rows={3}
                  placeholder="Describe las actividades realizadas por el monitor esta semana..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Observaciones (opcional)</label>
                <textarea
                  name="observaciones"
                  rows={2}
                  placeholder="Notas adicionales..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
              </div>
              {error && (
                <p className="flex items-center gap-1.5 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" /> {error}
                </p>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors font-medium disabled:opacity-50"
                >
                  {isPending ? "Guardando..." : "Guardar informe"}
                </button>
              </div>
            </form>
          )}

          {success && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2.5">
              <CheckCircle className="w-4 h-4" /> Informe registrado correctamente.
            </div>
          )}

          {/* Lista de informes */}
          {monitoria.informesSeguimiento.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-400">
              No hay informes registrados aún.
            </div>
          ) : (
            <div className="space-y-2">
              {monitoria.informesSeguimiento.map((inf) => {
                const isOpen = expandida === inf.id;
                const nota = inf.calificacionDesempeno;
                const colorNota = nota >= 4 ? "text-emerald-600" : nota >= 3 ? "text-amber-500" : "text-red-500";
                return (
                  <div key={inf.id} className="rounded-xl border border-gray-100 overflow-hidden">
                    <button
                      onClick={() => setExpandida(isOpen ? null : inf.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                          <span className="text-xs font-bold text-violet-600">S{inf.semana}</span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">Semana {inf.semana}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(inf.fecha).toLocaleDateString("es-CO")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Star className={cn("w-3.5 h-3.5", colorNota)} />
                          <span className={cn("text-sm font-semibold", colorNota)}>{nota}/5</span>
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 space-y-2 border-t border-gray-50 bg-gray-50/50">
                        <p className="text-sm text-gray-700 pt-3">{inf.contenido}</p>
                        {inf.observaciones && (
                          <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                            <span className="font-medium">Observaciones:</span> {inf.observaciones}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Horas */}
      {tab === "horas" && (
        <div className="space-y-2">
          {monitoria.registrosHoras.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-400">
              El monitor no ha registrado horas aún.
            </div>
          ) : (
            monitoria.registrosHoras.map((r) => {
              const estadoColor = r.estado === "APROBADO" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : r.estado === "RECHAZADO" ? "bg-red-50 text-red-600 border-red-100" : "bg-amber-50 text-amber-600 border-amber-100";
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 flex-shrink-0">
                    <Clock className="w-4 h-4 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.descripcion}</p>
                    <p className="text-xs text-gray-400">{new Date(r.fecha).toLocaleDateString("es-CO")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">{r.horasRegistradas}h</span>
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", estadoColor)}>
                      {r.estado}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab: Evidencias */}
      {tab === "evidencias" && (
        <div className="space-y-2">
          {monitoria.evidencias.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-400">
              No hay evidencias subidas aún.
            </div>
          ) : (
            monitoria.evidencias.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 flex-shrink-0">
                  <FileText className="w-4 h-4 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{ev.descripcion ?? "Sin descripción"}</p>
                  <p className="text-xs text-gray-400">
                    {ev.tipo} · {new Date(ev.fechaSubida).toLocaleDateString("es-CO")}
                  </p>
                </div>
                <a
                  href={ev.archivoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-violet-600 hover:underline font-medium"
                >
                  Ver
                </a>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
