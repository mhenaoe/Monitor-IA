import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { obtenerConvocatoria, obtenerCursos } from "@/lib/actions/convocatorias";
import { EditarConvocatoriaForm } from "./editar-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarConvocatoriaPage({ params }: Props) {
  const { id } = await params;

  const [conv, cursos] = await Promise.all([
    obtenerConvocatoria(id),
    obtenerCursos(),
  ]);

  if (!conv) redirect("/docente/convocatorias");

  return (
    <div className="space-y-4">
      <Link
        href="/docente/convocatorias"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a convocatorias
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Editar Convocatoria
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Modifica los datos de la convocatoria de{" "}
              <span className="font-semibold text-gray-700">
                {conv.curso.nombre}
              </span>
              .
            </p>
          </div>

          <EditarConvocatoriaForm
            convocatoria={{
              id: conv.id,
              cursoId: conv.cursoId,
              fechaInicio: conv.fechaInicio.toISOString().split("T")[0],
              fechaFin: conv.fechaFin.toISOString().split("T")[0],
              estado: conv.estado,
              preguntasFase1: conv.preguntasFase1 as { pregunta: string; tipo: string }[],
            }}
            cursos={cursos}
          />
        </div>
      </div>
    </div>
  );
}
