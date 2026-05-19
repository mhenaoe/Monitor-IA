"use server";

import { db } from "@/lib/db";

export async function obtenerStatsLanding() {
  try {
    const [convocatoriasActivas, estudiantesPostulados, monitoresAsignados] =
      await Promise.all([
        db.convocatoria.count({
          where: {
            estado: "PUBLICADA",
            fechaFin: { gte: new Date() },
          },
        }),
        db.postulacion.count({
          where: {
            estado: {
              in: ["EN_PROCESO", "APROBADA_FASE_1", "APROBADA_FASE_2"],
            },
          },
        }),
        db.postulacion.count({
          where: { estado: "ACEPTADO" },
        }),
      ]);

    return {
      convocatoriasActivas,
      estudiantesPostulados,
      monitoresAsignados,
    };
  } catch {
    // Si la DB no está disponible (Neon dormida), retorna 0s
    return {
      convocatoriasActivas: 0,
      estudiantesPostulados: 0,
      monitoresAsignados: 0,
    };
  }
}