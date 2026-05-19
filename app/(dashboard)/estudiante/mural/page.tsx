import { obtenerConvocatoriasActivas } from "@/lib/actions/postulaciones";
import { auth } from "@/lib/auth";
import { MuralClient } from "./mural-client";
import { BookOpen } from "lucide-react";

export default async function MuralPage() {
  const session = await auth();
  const convocatorias = await obtenerConvocatoriasActivas();

  // Extraer programa del estudiante para mostrarlo en el header
  const programa = convocatorias[0]?.curso.programa ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Mural de Convocatorias
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {session?.user.nombre ? `Hola, ${session.user.nombre}. ` : ""}
              Explora las monitorías disponibles{programa ? ` en ${programa}` : ""}.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-violet-50 px-3 py-1.5 rounded-full">
            <BookOpen className="w-3.5 h-3.5 text-violet-600" />
            <span>
              <span className="font-semibold text-violet-700">
                {convocatorias.length}
              </span>{" "}
              {convocatorias.length === 1 ? "activa" : "activas"}
            </span>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <MuralClient
        convocatorias={convocatorias.map((c) => ({
          id: c.id,
          cursoNombre: c.curso.nombre,
          cursoCodigo: c.curso.codigo,
          programa: c.curso.programa,
          semestre: c.curso.semestre,
          fechaInicio: c.fechaInicio,
          fechaFin: c.fechaFin,
          docenteNombre: `${c.docente.usuario.nombre} ${c.docente.usuario.apellido}`,
          totalCriterios: c._count.criterios,
          totalPostulaciones: c._count.postulaciones,
          miPostulacion: c.postulaciones[0] ?? null,
        }))}
      />
    </div>
  );
}