import Link from "next/link";
import { FileQuestion, Plus } from "lucide-react";
import {
  obtenerBorradoresDelDocente,
  obtenerConvocatoria,
} from "@/lib/actions/convocatorias";
import { Button } from "@/components/ui/button";
import { CriteriosClient } from "./criterios-client";

interface Props {
  searchParams: Promise<{
    convocatoria?: string;
  }>;
}

export default async function CriteriosPage({ searchParams }: Props) {
  const params = await searchParams;
  const paramId = params.convocatoria;

  // Cargar borradores disponibles para el selector
  const borradores = await obtenerBorradoresDelDocente();

  // ─── Estado vacío: sin borradores ───
  if (borradores.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Filtros Automáticos (Fase I)
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Configura las reglas de paso automático apoyadas por IA.
          </p>
        </div>

        <EstadoVacio />
      </div>
    );
  }

  // ─── Determinar la convocatoria activa ───
  // Prioridad: URL param → primer borrador
  const convocatoriaId =
    paramId && borradores.some((b) => b.id === paramId)
      ? paramId
      : borradores[0].id;

  const convocatoriaActiva = await obtenerConvocatoria(convocatoriaId);

  if (!convocatoriaActiva) {
    // Edge case: la convocatoria no existe o fue borrada
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Filtros Automáticos (Fase I)
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Configura las reglas de paso automático apoyadas por IA.
          </p>
        </div>

        <EstadoVacio />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Filtros Automáticos (Fase I)
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Configura las reglas de paso automático apoyadas por IA.
        </p>
      </div>

      <CriteriosClient
        borradores={borradores.map((b) => ({
          id: b.id,
          cursoNombre: b.curso.nombre,
          cursoCodigo: b.curso.codigo,
          totalCriterios: b._count.criterios,
        }))}
        convocatoriaActivaId={convocatoriaActiva.id}
        criteriosExistentes={convocatoriaActiva.criterios}
      />
    </div>
  );
}

// ─── Sub-componente: Estado vacío ───

function EstadoVacio() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
        <FileQuestion className="h-7 w-7 text-violet-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">
        No tienes convocatorias en borrador
      </h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm">
        Los criterios de validación se definen sobre convocatorias en estado
        borrador. Crea una nueva para empezar a configurarlos.
      </p>
      <Link href="/docente/convocatorias/nueva" className="mt-6">
        <Button variant="primary">
          <Plus className="w-4 h-4" />
          Nueva convocatoria
        </Button>
      </Link>
    </div>
  );
}