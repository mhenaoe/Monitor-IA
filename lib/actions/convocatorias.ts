"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  crearConvocatoriaSchema,
  crearCriterioSchema,
} from "@/lib/validators/convocatoria";

// ─────────────────────────────────────────────
// HU-5: Crear Convocatoria
// ─────────────────────────────────────────────
export async function crearConvocatoria(formData: FormData) {
  const session = await auth();
  if (!session || session.user.rol !== "DOCENTE") {
    return { error: "No autorizado" };
  }

  const raw = {
    cursoId: formData.get("cursoId") as string,
    fechaInicio: formData.get("fechaInicio") as string,
    fechaFin: formData.get("fechaFin") as string,
    preguntasFase1: JSON.parse(
      (formData.get("preguntasFase1") as string) || "[]"
    ),
  };

  const parsed = crearConvocatoriaSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors };
  }

  const { cursoId, fechaInicio, fechaFin, preguntasFase1 } = parsed.data;

  // Validar que las fechas sean coherentes
  if (new Date(fechaInicio) >= new Date(fechaFin)) {
    return { error: "La fecha de inicio debe ser anterior a la de cierre" };
  }

  try {
    const convocatoria = await db.convocatoria.create({
      data: {
        cursoId,
        docenteId: session.user.docenteId!,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        preguntasFase1,
        estado: "BORRADOR",
      },
    });

    revalidatePath("/docente/convocatorias");
    return { success: true, id: convocatoria.id };
  } catch {
    return { error: "Error al crear la convocatoria" };
  }
}

// ─────────────────────────────────────────────
// HU-7: Publicar Convocatoria (+ HU-10 notificaciones)
// ─────────────────────────────────────────────
export async function publicarConvocatoria(convocatoriaId: string) {
  const session = await auth();
  if (!session || session.user.rol !== "DOCENTE") {
    return { error: "No autorizado" };
  }

  try {
    const convocatoria = await db.convocatoria.findFirst({
      where: { id: convocatoriaId, docenteId: session.user.docenteId },
      include: { criterios: true, curso: true },
    });

    if (!convocatoria) return { error: "Convocatoria no encontrada" };
    if (convocatoria.estado !== "BORRADOR") {
      return { error: "Solo se pueden publicar convocatorias en borrador" };
    }
    if (convocatoria.criterios.length === 0) {
      return { error: "Debes definir al menos un criterio de validación" };
    }

    await db.convocatoria.update({
      where: { id: convocatoriaId },
      data: { estado: "PUBLICADA" },
    });

    // HU-10: Notificar a estudiantes del programa
    const estudiantes = await db.estudiante.findMany({
      where: { programa: convocatoria.curso.programa },
      include: { usuario: true },
    });

    if (estudiantes.length > 0) {
      await db.notificacion.createMany({
        data: estudiantes.map((est) => ({
          tipo: "PUBLICACION_CONVOCATORIA" as const,
          destinatarioCorreo: est.usuario.correo,
          mensaje: `Nueva convocatoria de monitoría disponible para ${convocatoria.curso.nombre}. Postúlate antes del ${convocatoria.fechaFin.toLocaleDateString(
            "es-CO"
          )}.`,
          usuarioId: est.usuario.id,
        })),
      });
    }

    revalidatePath("/docente/convocatorias");
    revalidatePath("/estudiante/mural");
    revalidatePath("/login");
    return { success: true };
  } catch {
    return { error: "Error al publicar la convocatoria" };
  }
}

// ─────────────────────────────────────────────
// HU-9: Cerrar Convocatoria
// ─────────────────────────────────────────────
export async function cerrarConvocatoria(convocatoriaId: string) {
  const session = await auth();
  if (!session || session.user.rol !== "DOCENTE") {
    return { error: "No autorizado" };
  }

  try {
    const conv = await db.convocatoria.findFirst({
      where: { id: convocatoriaId, docenteId: session.user.docenteId },
    });
    if (!conv) return { error: "Convocatoria no encontrada" };
    if (conv.estado !== "PUBLICADA") {
      return { error: "Solo se pueden cerrar convocatorias publicadas" };
    }

    await db.convocatoria.update({
      where: { id: convocatoriaId },
      data: { estado: "CERRADA" },
    });

    revalidatePath("/docente/convocatorias");
    revalidatePath("/estudiante/mural");
    revalidatePath("/login");
    return { success: true };
  } catch {
    return { error: "Error al cerrar la convocatoria" };
  }
}

// ─────────────────────────────────────────────
// HU-6: Agregar Criterio de Validación
// ─────────────────────────────────────────────
export async function agregarCriterio(formData: FormData) {
  const session = await auth();
  if (!session || session.user.rol !== "DOCENTE") {
    return { error: "No autorizado" };
  }

  const raw = {
    convocatoriaId: formData.get("convocatoriaId") as string,
    nombre: formData.get("nombre") as string,
    tipo: formData.get("tipo") as string,
    campo: formData.get("campo") as string,
    operador: formData.get("operador") as string,
    valor: formData.get("valor") as string,
    fuente: formData.get("fuente") as string,
  };

  const parsed = crearCriterioSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Datos inválidos", detalles: parsed.error.flatten().fieldErrors };
  }

  try {
    // Verificar que la convocatoria pertenece al docente
    const conv = await db.convocatoria.findFirst({
      where: {
        id: parsed.data.convocatoriaId,
        docenteId: session.user.docenteId,
      },
    });
    if (!conv) return { error: "Convocatoria no encontrada" };
    if (conv.estado !== "BORRADOR") {
      return { error: "Solo se pueden agregar criterios a convocatorias en borrador" };
    }

    await db.criterioValidacion.create({
      data: parsed.data,
    });

    revalidatePath("/docente/criterios");
    return { success: true };
  } catch {
    return { error: "Error al crear el criterio" };
  }
}

// ─────────────────────────────────────────────
// Eliminar Criterio (utilidad)
// ─────────────────────────────────────────────
export async function eliminarCriterio(criterioId: string) {
  const session = await auth();
  if (!session || session.user.rol !== "DOCENTE") {
    return { error: "No autorizado" };
  }

  try {
    // Verificar que el criterio pertenece a una convocatoria del docente
    const criterio = await db.criterioValidacion.findUnique({
      where: { id: criterioId },
      include: { convocatoria: true },
    });

    if (!criterio || criterio.convocatoria.docenteId !== session.user.docenteId) {
      return { error: "No autorizado" };
    }

    if (criterio.convocatoria.estado !== "BORRADOR") {
      return { error: "Solo se pueden eliminar criterios de convocatorias en borrador" };
    }

    await db.criterioValidacion.delete({ where: { id: criterioId } });
    revalidatePath("/docente/criterios");
    return { success: true };
  } catch {
    return { error: "Error al eliminar el criterio" };
  }
}

// ─────────────────────────────────────────────
// Consultas (read-only)
// ─────────────────────────────────────────────

export async function obtenerMisConvocatorias() {
  const session = await auth();
  if (!session || !session.user.docenteId) return [];

  return db.convocatoria.findMany({
    where: { docenteId: session.user.docenteId },
    include: {
      curso: true,
      _count: { select: { postulaciones: true, criterios: true } },
    },
    orderBy: { creadoEn: "desc" },
  });
}

export async function obtenerCursos() {
  return db.curso.findMany({
    orderBy: { nombre: "asc" },
  });
}

export async function obtenerConvocatoria(id: string) {
  return db.convocatoria.findUnique({
    where: { id },
    include: {
      curso: true,
      docente: { include: { usuario: true } },
      criterios: true,
    },
  });
}

// ─────────────────────────────────────────────
// Obtener convocatorias editables (BORRADOR) del docente
// Usado en /docente/criterios para el selector
// ─────────────────────────────────────────────
export async function obtenerBorradoresDelDocente() {
  const session = await auth();
  if (!session || !session.user.docenteId) return [];

  return db.convocatoria.findMany({
    where: {
      docenteId: session.user.docenteId,
      estado: "BORRADOR",
    },
    include: {
      curso: true,
      _count: { select: { criterios: true } },
    },
    orderBy: { creadoEn: "desc" },
  });
}

// ─────────────────────────────────────────────
// Obtener convocatorias publicadas/cerradas del docente
// Usado en /docente/revision para el selector
// ─────────────────────────────────────────────
export async function obtenerConvocatoriasConCandidatos() {
  const session = await auth();
  if (!session || !session.user.docenteId) return [];

  return db.convocatoria.findMany({
    where: {
      docenteId: session.user.docenteId,
      estado: { in: ["PUBLICADA", "CERRADA"] },
    },
    include: {
      curso: true,
      _count: { select: { postulaciones: true } },
    },
    orderBy: { creadoEn: "desc" },
  });
}