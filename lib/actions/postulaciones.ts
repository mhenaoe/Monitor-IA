"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────
// HU-13 + HU-16 + HU-17: Postularse Fase 1
//   con validación automática y bloqueo
// ─────────────────────────────────────────────
export async function postularseFase1(
  convocatoriaId: string,
  respuestas: Record<string, string>
) {
  const session = await auth();
  if (!session || session.user.rol !== "ESTUDIANTE") {
    return { error: "No autorizado" };
  }

  try {
    // Verificar que la convocatoria está publicada
    const convocatoria = await db.convocatoria.findFirst({
      where: { id: convocatoriaId, estado: "PUBLICADA" },
      include: { criterios: true, curso: true },
    });

    if (!convocatoria) return { error: "Convocatoria no disponible" };
    if (new Date() > convocatoria.fechaFin) {
      return { error: "La convocatoria ya cerró" };
    }

    // Verificar que no se haya postulado antes (constraint @@unique)
    const existente = await db.postulacion.findUnique({
      where: {
        estudianteId_convocatoriaId: {
          estudianteId: session.user.estudianteId!,
          convocatoriaId,
        },
      },
    });
    if (existente) return { error: "Ya te postulaste a esta convocatoria" };

    // HU-16: Validación automática de criterios Fase 1
    const estudiante = await db.estudiante.findUnique({
      where: { id: session.user.estudianteId },
    });
    if (!estudiante) return { error: "Perfil de estudiante no encontrado" };

    // Separar respuestas: preguntas abiertas (preguntasFase1) vs criterios manuales
    const respuestasManuales: Record<string, string> = {};
    for (const criterio of convocatoria.criterios) {
      if (criterio.tipo === "MANUAL" && respuestas[criterio.campo]) {
        respuestasManuales[criterio.campo] = respuestas[criterio.campo];
      }
    }

    const resultadoValidacion = validarCriterios(
      convocatoria.criterios,
      estudiante,
      respuestasManuales
    );

    // HU-17: Bloqueo por incumplimiento
    if (!resultadoValidacion.aprobado) {
      // Registrar postulación RECHAZADA
      await db.postulacion.create({
        data: {
          estudianteId: session.user.estudianteId!,
          convocatoriaId,
          respuestasFase1: respuestas,
          estado: "RECHAZADA",
          faseActual: "FASE_1",
        },
      });

      // HU-15: Notificación de rechazo
      await db.notificacion.create({
        data: {
          tipo: "RECHAZO_FASE_1",
          destinatarioCorreo: session.user.email!,
          mensaje: `No cumples los requisitos para la convocatoria de ${convocatoria.curso.nombre}. Criterios no satisfechos: ${resultadoValidacion.criteriosFallidos.join("; ")}`,
          usuarioId: session.user.id,
        },
      });

      revalidatePath("/estudiante/mural");
      return {
        error: "No cumples los criterios mínimos",
        criteriosFallidos: resultadoValidacion.criteriosFallidos,
        bloqueado: true,
      };
    }

    // Aprobó Fase 1 — crear postulación activa
    const postulacion = await db.postulacion.create({
      data: {
        estudianteId: session.user.estudianteId!,
        convocatoriaId,
        respuestasFase1: respuestas,
        estado: "APROBADA_FASE_1",
        faseActual: "FASE_1",
      },
    });

    revalidatePath("/estudiante/mural");
    revalidatePath("/docente/revision");
    return { success: true, id: postulacion.id };
  } catch {
    return { error: "Error al procesar la postulación" };
  }
}

// ─────────────────────────────────────────────
// HU-16: Motor de validación automática
// ─────────────────────────────────────────────
function validarCriterios(
  criterios: {
    id: string;
    nombre: string;
    campo: string;
    operador: string;
    valor: string;
    tipo: string;
  }[],
  estudiante: {
    promedioAcumulado: number;
    semestre: number;
    creditosAprobados: number;
  },
  respuestasManuales: Record<string, string>
) {
  const criteriosFallidos: string[] = [];

  for (const criterio of criterios) {
    if (criterio.tipo === "AUTOMATICO_SIS") {
      // ─── Automático: evalúa contra datos del SA ───
      const valorEstudiante = getValorEstudiante(criterio.campo, estudiante);
      if (valorEstudiante === null) continue;

      const valorCriterio = parseFloat(criterio.valor);
      let cumple = false;

      switch (criterio.operador) {
        case ">=": cumple = valorEstudiante >= valorCriterio; break;
        case "<=": cumple = valorEstudiante <= valorCriterio; break;
        case "==": cumple = valorEstudiante === valorCriterio; break;
        case "!=": cumple = valorEstudiante !== valorCriterio; break;
        case ">": cumple = valorEstudiante > valorCriterio; break;
        case "<": cumple = valorEstudiante < valorCriterio; break;
      }

      if (!cumple) {
        criteriosFallidos.push(
          `${criterio.nombre} (tu valor: ${valorEstudiante}, requerido: ${criterio.operador} ${criterio.valor})`
        );
      }
    } else if (criterio.tipo === "MANUAL") {
      // ─── Manual: evalúa contra respuesta del formulario ───
      const respuestaEstudiante = respuestasManuales[criterio.campo]?.trim();

      if (!respuestaEstudiante) {
        criteriosFallidos.push(`${criterio.nombre} (no respondiste)`);
        continue;
      }

      const valorEsperado = criterio.valor.trim();
      let cumple = false;

      // Comparación case-insensitive
      switch (criterio.operador) {
        case "==":
          cumple = respuestaEstudiante.toLowerCase() === valorEsperado.toLowerCase();
          break;
        case "!=":
          cumple = respuestaEstudiante.toLowerCase() !== valorEsperado.toLowerCase();
          break;
      }

      if (!cumple) {
        criteriosFallidos.push(
          `${criterio.nombre} (respuesta esperada: ${valorEsperado})`
        );
      }
    }
  }

  return {
    aprobado: criteriosFallidos.length === 0,
    criteriosFallidos,
  };
}

function getValorEstudiante(
  campo: string,
  estudiante: {
    promedioAcumulado: number;
    semestre: number;
    creditosAprobados: number;
  }
): number | null {
  switch (campo) {
    case "promedioAcumulado":
      return estudiante.promedioAcumulado;
    case "semestre":
      return estudiante.semestre;
    case "creditosAprobados":
      return estudiante.creditosAprobados;
    default:
      return null;
  }
}

// ─────────────────────────────────────────────
// HU-19: Obtener candidatos de una convocatoria
// ─────────────────────────────────────────────
export async function obtenerCandidatos(convocatoriaId: string) {
  const session = await auth();
  if (!session || session.user.rol !== "DOCENTE") return [];

  // Verificar que la convocatoria es del docente
  const conv = await db.convocatoria.findFirst({
    where: { id: convocatoriaId, docenteId: session.user.docenteId },
  });
  if (!conv) return [];

  return db.postulacion.findMany({
    where: {
      convocatoriaId,
      estado: {
        in: ["APROBADA_FASE_1", "APROBADA_FASE_2", "ACEPTADO", "DENEGADO"],
      },
    },
    include: {
      estudiante: {
        include: { usuario: true },
      },
    },
    orderBy: [
      { puntajeIA: { sort: "desc", nulls: "last" } },
      { fechaPostulacion: "asc" },
    ],
  });
}

// ─────────────────────────────────────────────
// HU-23 + HU-25: Aceptar o rechazar candidato
//   (con notificación del resultado)
// ─────────────────────────────────────────────
export async function actualizarEstadoCandidato(
  postulacionId: string,
  nuevoEstado: "ACEPTADO" | "DENEGADO"
) {
  const session = await auth();
  if (!session || session.user.rol !== "DOCENTE") {
    return { error: "No autorizado" };
  }

  try {
    // Verificar que la postulación pertenece a una convocatoria del docente
    const existente = await db.postulacion.findUnique({
      where: { id: postulacionId },
      include: { convocatoria: true },
    });

    if (!existente) return { error: "Postulación no encontrada" };
    if (existente.convocatoria.docenteId !== session.user.docenteId) {
      return { error: "No autorizado" };
    }

    const postulacion = await db.postulacion.update({
      where: { id: postulacionId },
      data: { estado: nuevoEstado },
      include: {
        estudiante: { include: { usuario: true } },
        convocatoria: { include: { curso: true } },
      },
    });

    // HU-25: Notificación del resultado
    const esAceptado = nuevoEstado === "ACEPTADO";
    await db.notificacion.create({
      data: {
        tipo: "RESULTADO_SELECCION",
        destinatarioCorreo: postulacion.estudiante.usuario.correo,
        mensaje: esAceptado
          ? `¡Felicidades! Fuiste seleccionado como monitor de ${postulacion.convocatoria.curso.nombre}.`
          : `No fuiste seleccionado como monitor de ${postulacion.convocatoria.curso.nombre}. Te invitamos a intentarlo en futuras convocatorias.`,
        usuarioId: postulacion.estudiante.usuario.id,
      },
    });

    revalidatePath("/docente/revision");
    revalidatePath("/estudiante/mural");
    return { success: true };
  } catch {
    return { error: "Error al actualizar el estado" };
  }
}

// ─────────────────────────────────────────────
// HU-24: Asignación formal del monitor
// ─────────────────────────────────────────────
export async function asignarMonitor(postulacionId: string) {
  const session = await auth();
  if (!session || session.user.rol !== "DOCENTE") {
    return { error: "No autorizado" };
  }

  try {
    const postulacion = await db.postulacion.findUnique({
      where: { id: postulacionId },
      include: {
        convocatoria: { include: { curso: true } },
        estudiante: true,
      },
    });

    if (!postulacion) return { error: "Postulación no encontrada" };
    if (postulacion.convocatoria.docenteId !== session.user.docenteId) {
      return { error: "No autorizado" };
    }
    if (postulacion.estado !== "ACEPTADO") {
      return { error: "Solo se pueden asignar candidatos aceptados" };
    }

    // En el Release 1 la asignación es conceptual (cambio de estado).
    // En el Release 2 se creará la entidad Monitoria + Monitor.
    revalidatePath("/docente/revision");
    return { success: true };
  } catch {
    return { error: "Error en la asignación" };
  }
}

// ─────────────────────────────────────────────
// Consultas para el estudiante
// ─────────────────────────────────────────────

export async function obtenerConvocatoriasActivas() {
  const session = await auth();
  if (!session || !session.user.estudianteId) return [];

  const estudiante = await db.estudiante.findUnique({
    where: { id: session.user.estudianteId },
  });
  if (!estudiante) return [];

  const convocatorias = await db.convocatoria.findMany({
    where: {
      estado: "PUBLICADA",
      curso: { programa: estudiante.programa },
      fechaFin: { gte: new Date() },
    },
    include: {
      curso: true,
      docente: { include: { usuario: true } },
      _count: { select: { postulaciones: true, criterios: true } },
      postulaciones: {
        where: { estudianteId: session.user.estudianteId },
        select: { id: true, estado: true, faseActual: true },
      },
    },
    orderBy: { fechaFin: "asc" },
  });

  return convocatorias;
}

export async function obtenerMisPostulaciones() {
  const session = await auth();
  if (!session || !session.user.estudianteId) return [];

  return db.postulacion.findMany({
    where: { estudianteId: session.user.estudianteId },
    include: {
      convocatoria: {
        include: {
          curso: true,
          docente: { include: { usuario: true } },
        },
      },
    },
    orderBy: { fechaPostulacion: "desc" },
  });
}

// ─────────────────────────────────────────────
// Obtener detalle de convocatoria para estudiante
// Con criterios + estado de postulación si existe
// ─────────────────────────────────────────────
export async function obtenerDetalleConvocatoria(convocatoriaId: string) {
  const session = await auth();
  if (!session || !session.user.estudianteId) return null;

  const estudiante = await db.estudiante.findUnique({
    where: { id: session.user.estudianteId },
  });
  if (!estudiante) return null;

  const convocatoria = await db.convocatoria.findUnique({
    where: { id: convocatoriaId },
    include: {
      curso: true,
      docente: { include: { usuario: true } },
      criterios: true,
      postulaciones: {
        where: { estudianteId: session.user.estudianteId },
        select: {
          id: true,
          estado: true,
          faseActual: true,
          fechaPostulacion: true,
        },
      },
    },
  });

  if (!convocatoria) return null;

  // Validar que pertenece al programa del estudiante
  if (convocatoria.curso.programa !== estudiante.programa) return null;

  return convocatoria;
}