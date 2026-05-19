import Link from "next/link";
import { Plus, Inbox } from "lucide-react";
import type { Convocatoria, Curso, EstadoConvocatoria } from "@prisma/client";
import { obtenerMisConvocatorias } from "@/lib/actions/convocatorias";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MenuAcciones } from "./menu-acciones";

type ConvocatoriaConRelaciones = Convocatoria & {
  curso: Curso;
  _count: { postulaciones: number; criterios: number };
};

function formatearFecha(fecha: Date | string | null): string {
  if (!fecha) return "—";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function mapEstadoAVariant(estado: EstadoConvocatoria) {
  const map = {
    BORRADOR: { variant: "borrador" as const, label: "Borrador" },
    PUBLICADA: { variant: "publicada" as const, label: "Publicada" },
    CERRADA: { variant: "cerrada" as const, label: "Cerrada" },
  };
  return map[estado];
}

export default async function ConvocatoriasPage() {
  const convocatorias =
    (await obtenerMisConvocatorias()) as ConvocatoriaConRelaciones[];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
      {/* Encabezado */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Mis Convocatorias
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra el estado de tus ofertas de monitoría.
          </p>
        </div>

        <Link href="/docente/convocatorias/nueva">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4" />
            Nueva
          </Button>
        </Link>
      </div>

      {/* Contenido */}
      {convocatorias.length === 0 ? (
        <EstadoVacio />
      ) : (
        <div className="overflow-x-auto -mx-6 sm:-mx-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <Th className="pl-6 sm:pl-8">Curso</Th>
                <Th>Estado</Th>
                <Th>Candidatos</Th>
                <Th>Cierre</Th>
                <Th className="pr-6 sm:pr-8 text-right">Acción</Th>
              </tr>
            </thead>
            <tbody>
              {convocatorias.map((c) => {
                const { variant, label } = mapEstadoAVariant(c.estado);
                const candidatos = c._count?.postulaciones ?? 0;
                // Si está en borrador, mostramos "—" porque aún no hay fecha de interés
                const mostrarFecha = c.estado !== "BORRADOR";

                return (
                  <tr
                    key={c.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition"
                  >
                    <Td className="pl-6 sm:pl-8 py-5">
                      <div className="font-semibold text-gray-900">
                        {c.curso?.nombre ?? "Sin curso"}
                      </div>
                      {c.curso?.codigo && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {c.curso.codigo}
                        </div>
                      )}
                    </Td>

                    <Td>
                      <Badge variant={variant}>{label}</Badge>
                    </Td>

                    <Td>
                      <span className="text-sm font-semibold text-gray-900">
                        {candidatos}
                      </span>
                    </Td>

                    <Td className="text-sm text-gray-600">
                      {mostrarFecha ? formatearFecha(c.fechaFin) : "—"}
                    </Td>

                    <Td className="pr-6 sm:pr-8 text-right">
                      <MenuAcciones
                        id={c.id}
                        estado={c.estado}
                        tieneCriterios={(c._count?.criterios ?? 0) > 0}
                      />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ───── Subcomponentes ─────

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-5 ${className}`}>{children}</td>;
}

function EstadoVacio() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
        <Inbox className="h-7 w-7 text-violet-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">
        No tienes convocatorias aún
      </h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm">
        Crea tu primera convocatoria para empezar a recibir postulaciones de
        estudiantes.
      </p>
      <Link href="/docente/convocatorias/nueva" className="mt-6">
        <Button variant="primary">
          <Plus className="w-4 h-4" />
          Crear convocatoria
        </Button>
      </Link>
    </div>
  );
}