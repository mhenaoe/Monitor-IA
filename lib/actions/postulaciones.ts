"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────
// HU-13 + HU-16 + HU-17: Postularse Fase 1
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
    const convocatoria = await db.convocatoria.findFirst({
      where: { id: convocatoriaId, estado: "PUBLICADA" },
      include: { criterios: true, curso: true },
    });

    if (!convocatoria) return { error: "Convocatoria no disponible" };
    if (new Date() > convocatoria.fechaFin) {
      return { error: "La convocatoria ya cerró" };
    }

    const existente = await db.postulacion.findUnique({
      where: {
        estudianteId_convocatoriaId: {
          estudianteId: session.user.estudianteId!,
          convocatoriaId,
        },
      },
    });
    if (existente) return { error: "Ya te postulaste a esta convocatoria" };

    const estudiante = await db.estudiante.findUnique({
      where: { id: session.user.estudianteId },
    });
    if (!estudiante) return { error: "Perfil de estudiante no encontrado" };

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

    if (!resultadoValidacion.aprobado) {
      await db.postulacion.create({
        data: {
          estudianteId: session.user.estudianteId!,
          convocatoriaId,
          respuestasFase1: respuestas,
          estado: "RECHAZADA",
          faseActual: "FASE_1",
        },
      });

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
      const respuestaEstudiante = respuestasManuales[criterio.campo]?.trim();

      if (!respuestaEstudiante) {
        criteriosFallidos.push(`${criterio.nombre} (no respondiste)`);
        continue;
      }

      const valorEsperado = criterio.valor.trim();
      let cumple = false;

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
    case "promedioAcumulado": return estudiante.promedioAcumulado;
    case "semestre": return estudiante.semestre;
    case "creditosAprobados": return estudiante.creditosAprobados;
    default: return null;
  }
}

// ─────────────────────────────────────────────
// HU-19: Obtener candidatos de una convocatoria
// ─────────────────────────────────────────────
export async function obtenerCandidatos(convocatoriaId: string) {
  const session = await auth();
  if (!session || session.user.rol !== "DOCENTE") return [];

  const conv = await db.convocatoria.findFirst({
    where: { id: convocatoriaId, docenteId: session.user.docenteId },
  });
  if (!conv) return [];

  return db.postulacion.findMany({
    where: {
      convocatoriaId,
      estado: { in: ["APROBADA_FASE_1", "APROBADA_FASE_2", "ACEPTADO", "DENEGADO"] },
    },
    include: {
      estudiante: { include: { usuario: true } },
    },
    orderBy: [
      { puntajeIA: { sort: "desc", nulls: "last" } },
      { fechaPostulacion: "asc" },
    ],
  });
}

// ─────────────────────────────────────────────
// HU-23 + HU-25: Aceptar o rechazar candidato
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

  return db.convocatoria.findMany({
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
  if (convocatoria.curso.programa !== estudiante.programa) return null;

  return convocatoria;
}

// ─────────────────────────────────────────────
// HU-14: Postularse a Fase 2 (subir hoja de vida)
// ─────────────────────────────────────────────
export async function postularseFase2(formData: FormData) {
  const session = await auth();
  if (!session || session.user.rol !== "ESTUDIANTE") {
    return { error: "No autorizado" };
  }

  const postulacionId = formData.get("postulacionId") as string;
  const hojaDeVidaUrl = formData.get("hojaDeVidaUrl") as string;

  if (!postulacionId || !hojaDeVidaUrl) {
    return { error: "Datos incompletos" };
  }

  try {
    const postulacion = await db.postulacion.findFirst({
      where: {
        id: postulacionId,
        estudianteId: session.user.estudianteId!,
        estado: "APROBADA_FASE_1",
      },
    });

    if (!postulacion) {
      return { error: "Postulación no encontrada o no elegible para Fase 2" };
    }

    await db.postulacion.update({
      where: { id: postulacionId },
      data: {
        hojaDeVidaUrl,
        faseActual: "FASE_2",
        estado: "APROBADA_FASE_2",
      },
    });

    revalidatePath("/estudiante/mural");
    revalidatePath("/estudiante/postulaciones");
    revalidatePath("/docente/revision");
    return { success: true };
  } catch {
    return { error: "Error al procesar la Fase 2" };
  }
}

// ─────────────────────────────────────────────
// HU-20: Ranking de candidatos con IA
// ─────────────────────────────────────────────
export async function calcularRankingIA(convocatoriaId: string) {
  const session = await auth();
  if (!session || session.user.rol !== "DOCENTE") {
    return { error: "No autorizado" };
  }

  try {
    const postulaciones = await db.postulacion.findMany({
      where: {
        convocatoriaId,
        estado: { in: ["APROBADA_FASE_1", "APROBADA_FASE_2"] },
      },
      include: {
        estudiante: { include: { usuario: true } },
        convocatoria: { include: { curso: true } },
      },
    });

    if (postulaciones.length === 0) {
      return { error: "No hay candidatos para evaluar" };
    }

    const curso = postulaciones[0].convocatoria.curso.nombre;

    const resultados = await Promise.all(
      postulaciones.map(async (p) => {
        const respuestas = p.respuestasFase1 as Record<string, string> | null;
        if (!respuestas) return { id: p.id, puntaje: 0 };

        const respuestasTexto = Object.entries(respuestas)
          .map(([key, val]) => `${key}: ${val}`)
          .join("\n");

        const prompt = `Eres un evaluador académico. Evalúa la siguiente postulación para ser monitor del curso "${curso}".

Respuestas del candidato:
${respuestasTexto}

Datos académicos:
- Promedio: ${p.estudiante.promedioAcumulado}
- Semestre: ${p.estudiante.semestre}

Asigna un puntaje del 0 al 10 basándote en:
1. Calidad y profundidad de las respuestas
2. Motivación demostrada
3. Experiencia relevante mencionada
4. Adecuación al perfil de monitor

Responde ÚNICAMENTE con un número decimal entre 0 y 10. Ejemplo: 7.5`;

        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 10 },
              }),
            }
          );

          const data = await response.json();
          const texto = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "0";
          const puntaje = Math.min(10, Math.max(0, parseFloat(texto) || 0));
          return { id: p.id, puntaje };
        } catch {
          return { id: p.id, puntaje: 0 };
        }
      })
    );

    await Promise.all(
      resultados.map((r) =>
        db.postulacion.update({
          where: { id: r.id },
          data: { puntajeIA: r.puntaje },
        })
      )
    );

    revalidatePath("/docente/revision");
    return { success: true, resultados };
  } catch {
    return { error: "Error al calcular el ranking" };
  }
}