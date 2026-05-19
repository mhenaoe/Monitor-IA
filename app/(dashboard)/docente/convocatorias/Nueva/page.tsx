import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  obtenerCursos,
  obtenerConvocatoria,
} from "@/lib/actions/convocatorias";
import { WizardHeader } from "./wizard-header";
import { Paso1Datos } from "./paso-1-datos";
import { Paso2Criterios } from "./paso-2-criterios";

interface Props {
  searchParams: Promise<{
    step?: string;
    id?: string;
  }>;
}

export default async function NuevaConvocatoriaPage({ searchParams }: Props) {
  const params = await searchParams;
  const step = params.step === "2" ? 2 : 1;
  const id = params.id;

  // ─── Paso 2: Criterios ───
  if (step === 2) {
    if (!id) {
      redirect("/docente/convocatorias/nueva?step=1");
    }
    const conv = await obtenerConvocatoria(id);
    if (!conv) {
      redirect("/docente/convocatorias");
    }
    if (conv.estado !== "BORRADOR") {
      // Si ya está publicada/cerrada, no se pueden editar criterios
      redirect("/docente/convocatorias");
    }

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
          <div className="p-6 sm:p-8 pb-0">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Criterios de Validación
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Define los requisitos que debe cumplir un estudiante para postularse a{" "}
                  <span className="font-semibold text-gray-700">
                    {conv.curso.nombre}
                  </span>
                  .
                </p>
              </div>
            </div>

            <WizardHeader currentStep={2} />
          </div>

          <div className="p-6 sm:p-8">
            <Paso2Criterios
              convocatoriaId={conv.id}
              criteriosExistentes={conv.criterios}
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── Paso 1: Datos básicos ───
  const cursos = await obtenerCursos();

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
        <div className="p-6 sm:p-8 pb-0">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Nueva Convocatoria
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Crea una oferta de monitoría para uno de tus cursos.
              </p>
            </div>
          </div>

          <WizardHeader currentStep={1} />
        </div>

        <div className="p-6 sm:p-8">
          <Paso1Datos cursos={cursos} />
        </div>
      </div>
    </div>
  );
}