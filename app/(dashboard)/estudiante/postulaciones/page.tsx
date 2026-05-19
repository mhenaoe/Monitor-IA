import Link from "next/link";
import { ClipboardList, Inbox, ArrowRight } from "lucide-react";
import { obtenerMisPostulaciones } from "@/lib/actions/postulaciones";
import { Button } from "@/components/ui/button";
import { PostulacionesClient } from "./postulaciones-client";

export default async function MisPostulacionesPage() {
  const postulaciones = await obtenerMisPostulaciones();

  // ─── Estado vacío: sin postulaciones ───
  if (postulaciones.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Mis Postulaciones
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                El historial completo de tus postulaciones a monitorías.
              </p>
            </div>
          </div>

          <EstadoVacio />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Mis Postulaciones
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              El historial completo de tus postulaciones a monitorías.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-violet-50 px-3 py-1.5 rounded-full">
            <ClipboardList className="w-3.5 h-3.5 text-violet-600" />
            <span>
              <span className="font-semibold text-violet-700">
                {postulaciones.length}
              </span>{" "}
              {postulaciones.length === 1 ? "total" : "totales"}
            </span>
          </div>
        </div>
      </div>

      {/* Lista */}
      <PostulacionesClient
        postulaciones={postulaciones.map((p) => ({
          id: p.id,
          estado: p.estado,
          faseActual: p.faseActual,
          fechaPostulacion: p.fechaPostulacion,
          convocatoria: {
            id: p.convocatoria.id,
            estado: p.convocatoria.estado,
            fechaFin: p.convocatoria.fechaFin,
            curso: {
              nombre: p.convocatoria.curso.nombre,
              codigo: p.convocatoria.curso.codigo,
              semestre: p.convocatoria.curso.semestre,
            },
            docente: {
              nombre: `${p.convocatoria.docente.usuario.nombre} ${p.convocatoria.docente.usuario.apellido}`,
            },
          },
        }))}
      />
    </div>
  );
}

// ─── Estado vacío ───

function EstadoVacio() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
        <Inbox className="h-7 w-7 text-violet-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">
        Aún no tienes postulaciones
      </h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm">
        Cuando te postules a una convocatoria de monitoría, el historial
        aparecerá aquí.
      </p>
      <Link href="/estudiante/mural" className="mt-6">
        <Button variant="primary">
          <ArrowRight className="w-4 h-4" />
          Ir al mural
        </Button>
      </Link>
    </div>
  );
}