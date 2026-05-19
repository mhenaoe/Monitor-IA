"use client";

import { useState, useTransition } from "react";
import { registrarHoras } from "@/lib/actions/seguimiento";
import { Clock, Plus, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RegistroHoras {
  id: string;
  fecha: string;
  horasRegistradas: number;
  descripcion: string;
  estado: string;
}

interface Props {
  monitoria: {
    id: string;
    horasTotales: number;
    curso: { nombre: string; codigo: string };
    docente: { nombre: string; apellido: string };
    registrosHoras: RegistroHoras[];
  };
}

export function HorasClient({ monitoria }: Props) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalAprobadas = monitoria.registrosHoras
    .filter((r) => r.estado === "APROBADO")
    .reduce((acc, r) => acc + r.horasRegistradas, 0);

  const horasSemana = monitoria.registrosHoras
    .filter((r) => {
      const fecha = new Date(r.fecha);
      const hoy = new Date();
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - hoy.getDay());
      return fecha >= inicioSemana;
    })
    .reduce((acc, r) => acc + r.horasRegistradas, 0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("monitoriaId", monitoria.id);

    startTransition(async () => {
      const res = await registrarHoras(formData);
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
      {/* Tarjetas resumen */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-100 bg-violet-50 p-4 text-center">
          <p className="text-2xl font-bold text-violet-600">{monitoria.horasTotales}</p>
          <p className="text-xs text-gray-500 mt-0.5">Horas registradas</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-emerald-50 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{totalAprobadas}</p>
          <p className="text-xs text-gray-500 mt-0.5">Horas aprobadas</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">{horasSemana}</p>
          <p className="text-xs text-gray-500 mt-0.5">Esta semana</p>
        </div>
      </div>

      {/* Botón nuevo registro */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {monitoria.registrosHoras.length} registro{monitoria.registrosHoras.length !== 1 ? "s" : ""} en total
        </p>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Registrar horas
        </button>
      </div>

      {/* Formulario */}
      {mostrarFormulario && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-violet-100 bg-violet-50/50 p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-gray-900">Nuevo registro de horas</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
              <input
                name="fecha"
                type="date"
                required
                max={new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Horas trabajadas</label>
              <input
                name="horasRegistradas"
                type="number"
                min={0.5}
                max={12}
                step={0.5}
                required
                placeholder="Ej: 2"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descripción de actividades</label>
            <textarea
              name="descripcion"
              required
              rows={3}
              placeholder="Describe qué actividades realizaste en tu monitoría..."
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
              {isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      )}

      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2.5">
          <CheckCircle className="w-4 h-4" /> Horas registradas correctamente. Pendientes de aprobación.
        </div>
      )}

      {/* Lista de registros */}
      {monitoria.registrosHoras.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400">
          No has registrado horas aún. ¡Empieza registrando tu primera sesión!
        </div>
      ) : (
        <div className="space-y-2">
          {monitoria.registrosHoras.map((r) => {
            const estadoColor =
              r.estado === "APROBADO"
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : r.estado === "RECHAZADO"
                ? "bg-red-50 text-red-600 border-red-100"
                : "bg-amber-50 text-amber-600 border-amber-100";

            return (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 flex-shrink-0">
                  <Clock className="w-4 h-4 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.descripcion}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(r.fecha).toLocaleDateString("es-CO")}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-semibold text-gray-700">
                    {r.horasRegistradas}h
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                      estadoColor
                    )}
                  >
                    {r.estado}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
