import { BarChart3 } from "lucide-react";
import { obtenerMisMonitorias } from "@/lib/actions/seguimiento";
import { SeguimientoClient } from "./seguimiento-client";

export default async function SeguimientoPage() {
  const monitorias = await obtenerMisMonitorias();

  if (monitorias.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Seguimiento de Monitorías
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Registra informes semanales y consulta el historial de desempeño de tus monitores.
          </p>
        </div>
        <EstadoVacio />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Seguimiento de Monitorías
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Tienes{" "}
          <span className="font-semibold text-gray-700">
            {monitorias.length} monitoría{monitorias.length !== 1 ? "s" : ""} activa{monitorias.length !== 1 ? "s" : ""}
          </span>
          . Registra informes y consulta el historial de desempeño.
        </p>
      </div>

      <SeguimientoClient
        monitorias={monitorias.map((m) => ({
          id: m.id,
          semestreActivo: m.semestreActivo,
          estado: m.estado,
          horasTotales: m.horasTotales,
          fechaInicio: m.fechaInicio.toISOString(),
          curso: { nombre: m.curso.nombre, codigo: m.curso.codigo },
          monitor: {
            nombre: m.monitor.estudiante.usuario.nombre,
            apellido: m.monitor.estudiante.usuario.apellido,
            correo: m.monitor.estudiante.usuario.correo,
          },
          registrosHoras: m.registrosHoras.map((r) => ({
            id: r.id,
            fecha: r.fecha.toISOString(),
            horasRegistradas: r.horasRegistradas,
            descripcion: r.descripcion,
            estado: r.estado,
          })),
          informesSeguimiento: m.informesSeguimiento.map((i) => ({
            id: i.id,
            semana: i.semana,
            fecha: i.fecha.toISOString(),
            contenido: i.contenido,
            calificacionDesempeno: i.calificacionDesempeno,
            observaciones: i.observaciones ?? null,
          })),
          evidencias: m.evidencias.map((e) => ({
            id: e.id,
            tipo: e.tipo,
            archivoUrl: e.archivoUrl,
            fechaSubida: e.fechaSubida.toISOString(),
            descripcion: e.descripcion ?? null,
          })),
        }))}
      />
    </div>
  );
}

function EstadoVacio() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
        <BarChart3 className="h-7 w-7 text-violet-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">
        No tienes monitorías activas
      </h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm">
        Cuando asignes formalmente un monitor desde la sección de Revisión &amp; Asignación, aparecerá aquí para que puedas hacer seguimiento semanal.
      </p>
    </div>
  );
}
