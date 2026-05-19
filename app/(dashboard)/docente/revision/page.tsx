import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { obtenerConvocatoriasConCandidatos } from "@/lib/actions/convocatorias";
import { obtenerCandidatos } from "@/lib/actions/postulaciones";
import { Button } from "@/components/ui/button";
import { RevisionClient } from "./revision-client";

interface Props {
  searchParams: Promise<{
    convocatoria?: string;
  }>;
}

export default async function RevisionPage({ searchParams }: Props) {
  const params = await searchParams;
  const paramId = params.convocatoria;

  // Cargar convocatorias disponibles
  const convocatorias = await obtenerConvocatoriasConCandidatos();

  // ─── Estado vacío: sin convocatorias publicadas ───
  if (convocatorias.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Candidatos Fase II
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Revisa y selecciona a los monitores de tus convocatorias.
          </p>
        </div>

        <EstadoVacio />
      </div>
    );
  }

  // ─── Determinar convocatoria activa ───
  const convocatoriaActivaId =
    paramId && convocatorias.some((c) => c.id === paramId)
      ? paramId
      : convocatorias[0].id;

  // Cargar candidatos de la convocatoria activa
  const candidatos = await obtenerCandidatos(convocatoriaActivaId);
  const convocatoriaActiva = convocatorias.find(
    (c) => c.id === convocatoriaActivaId
  )!;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Candidatos Fase II
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Revisa y selecciona a los monitores de{" "}
          <span className="font-semibold text-gray-700">
            {convocatoriaActiva.curso.nombre}
          </span>
          .
        </p>
      </div>

      <RevisionClient
        convocatorias={convocatorias.map((c) => ({
          id: c.id,
          cursoNombre: c.curso.nombre,
          cursoCodigo: c.curso.codigo,
          estado: c.estado,
          totalPostulaciones: c._count.postulaciones,
        }))}
        convocatoriaActivaId={convocatoriaActivaId}
        candidatos={candidatos.map((p) => ({
          id: p.id,
          estado: p.estado,
          faseActual: p.faseActual,
          fechaPostulacion: p.fechaPostulacion,
          puntajeIA: p.puntajeIA,
          estudiante: {
            id: p.estudiante.id,
            nombre: p.estudiante.usuario.nombre,
            apellido: p.estudiante.usuario.apellido,
            correo: p.estudiante.usuario.correo,
            programa: p.estudiante.programa,
            semestre: p.estudiante.semestre,
            promedioAcumulado: p.estudiante.promedioAcumulado,
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
        <Users className="h-7 w-7 text-violet-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">
        No tienes convocatorias publicadas
      </h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm">
        Para revisar candidatos, primero necesitas publicar una convocatoria.
        Crea y configura una nueva para recibir postulaciones.
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