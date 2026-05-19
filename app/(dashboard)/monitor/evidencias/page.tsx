import { FileText } from "lucide-react";
import { obtenerMisEvidencias } from "@/lib/actions/seguimiento";
import { EvidenciasClient } from "./evidencias-client";

export default async function EvidenciasPage() {
  const monitor = await obtenerMisEvidencias();

  if (!monitor || monitor.monitorias.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Evidencias
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Sube fotos, documentos y materiales de tu monitoría.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
            <FileText className="h-7 w-7 text-violet-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            No tienes monitorías activas
          </h3>
          <p className="mt-1 text-sm text-gray-500 max-w-sm">
            Cuando seas asignado como monitor, podrás subir evidencias de tu trabajo aquí.
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
          Evidencias
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitoría:{" "}
          <span className="font-semibold text-gray-700">{monitoria.curso.nombre}</span>
        </p>
      </div>

      <EvidenciasClient
        monitoria={{
          id: monitoria.id,
          curso: { nombre: monitoria.curso.nombre },
          evidencias: monitoria.evidencias.map((e) => ({
            id: e.id,
            tipo: e.tipo,
            archivoUrl: e.archivoUrl,
            fechaSubida: e.fechaSubida.toISOString(),
            descripcion: e.descripcion ?? null,
          })),
        }}
      />
    </div>
  );
}
