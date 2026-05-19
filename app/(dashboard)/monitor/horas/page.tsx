import { Clock } from "lucide-react";
import { obtenerMisHoras } from "@/lib/actions/seguimiento";
import { HorasClient } from "./horas-client";

export default async function HorasPage() {
  const monitor = await obtenerMisHoras();

  if (!monitor || monitor.monitorias.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Registro de Horas
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Registra tus horas de monitoría semanalmente.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
            <Clock className="h-7 w-7 text-violet-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            No tienes monitorías activas
          </h3>
          <p className="mt-1 text-sm text-gray-500 max-w-sm">
            Cuando seas asignado formalmente como monitor, podrás registrar tus horas aquí.
          </p>
        </div>
      </div>
    );
  }

  const monitoria = monitor.monitorias[0];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Registro de Horas
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitoría activa:{" "}
          <span className="font-semibold text-gray-700">{monitoria.curso.nombre}</span>
        </p>
      </div>

      <HorasClient
        monitoria={{
          id: monitoria.id,
          horasTotales: monitoria.horasTotales,
          curso: { nombre: monitoria.curso.nombre, codigo: monitoria.curso.codigo },
          docente: {
            nombre: monitoria.docente.usuario.nombre,
            apellido: monitoria.docente.usuario.apellido,
          },
          registrosHoras: monitoria.registrosHoras.map((r) => ({
            id: r.id,
            fecha: r.fecha.toISOString(),
            horasRegistradas: r.horasRegistradas,
            descripcion: r.descripcion,
            estado: r.estado,
          })),
        }}
      />
    </div>
  );
}
