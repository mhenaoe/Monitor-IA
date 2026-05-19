"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────
// HU-29: Registrar horas (Monitor)
// ─────────────────────────────────────────────
export async function registrarHoras(formData: FormData) {
  const session = await auth();
  if (!session || session.user.rol !== "MONITOR") {
    return { error: "No autorizado" };
  }

  const monitoriaId = formData.get("monitoriaId") as string;
  const fecha = formData.get("fecha") as string;
  const horasRegistradas = parseFloat(formData.get("horasRegistradas") as string);
  const descripcion = formData.get("descripcion") as string;

  if (!monitoriaId || !fecha || isNaN(horasRegistradas) || !descripcion) {
    return { error: "Datos incompletos" };
  }

  if (horasRegistradas <= 0 || horasRegistradas > 12) {
    return { error: "Las horas deben estar entre 0.5 y 12" };
  }

  try {
    // Verificar que la monitoria pertenece al monitor en sesión
    const monitoria = await db.monitoria.findFirst({
      where: {
        id: monitoriaId,
        monitor: { estudiante: { usuarioId: session.user.id } },
        estado: "ACTIVA",
      },
    });
    if (!monitoria) return { error: "Monitoría no encontrada o inactiva" };

    await db.registroHoras.create({
      data: {
        monitoriaId,
        fecha: new Date(fecha),
        horasRegistradas,
        descripcion,
        estado: "PENDIENTE",
      },
    });

    revalidatePath("/monitor/horas");
    return { success: true };
  } catch {
    return { error: "Error al registrar las horas" };
  }
}

// ─────────────────────────────────────────────
// HU-32: Controlar horas semanalmente (Monitor)
// ─────────────────────────────────────────────
export async function obtenerMisHoras() {
  const session = await auth();
  if (!session || session.user.rol !== "MONITOR") return null;

  const monitor = await db.monitor.findFirst({
    where: { estudiante: { usuarioId: session.user.id } },
    include: {
      monitorias: {
        where: { estado: "ACTIVA" },
        include: {
          curso: true,
          docente: { include: { usuario: true } },
          registrosHoras: { orderBy: { fecha: "desc" } },
        },
      },
    },
  });

  return monitor;
}

// ─────────────────────────────────────────────
// HU-28: Subir evidencias (Monitor)
// ─────────────────────────────────────────────
export async function subirEvidencia(formData: FormData) {
  const session = await auth();
  if (!session || session.user.rol !== "MONITOR") {
    return { error: "No autorizado" };
  }

  const monitoriaId = formData.get("monitoriaId") as string;
  const tipo = formData.get("tipo") as string;
  const archivoUrl = formData.get("archivoUrl") as string;
  const descripcion = formData.get("descripcion") as string;

  if (!monitoriaId || !tipo || !archivoUrl) {
    return { error: "Datos incompletos" };
  }

  try {
    const monitoria = await db.monitoria.findFirst({
      where: {
        id: monitoriaId,
        monitor: { estudiante: { usuarioId: session.user.id } },
      },
    });
    if (!monitoria) return { error: "Monitoría no encontrada" };

    await db.evidencia.create({
      data: {
        monitoriaId,
        tipo: tipo as any,
        archivoUrl,
        descripcion,
      },
    });

    revalidatePath("/monitor/evidencias");
    return { success: true };
  } catch {
    return { error: "Error al subir la evidencia" };
  }
}

export async function obtenerMisEvidencias() {
  const session = await auth();
  if (!session || session.user.rol !== "MONITOR") return null;

  return db.monitor.findFirst({
    where: { estudiante: { usuarioId: session.user.id } },
    include: {
      monitorias: {
        include: {
          curso: true,
          evidencias: { orderBy: { fechaSubida: "desc" } },
        },
      },
    },
  });
}

// ─────────────────────────────────────────────
// HU-26: Registrar informe de seguimiento semanal (Docente)
// ─────────────────────────────────────────────
export async function registrarInformeSeguimiento(formData: FormData) {
  const session = await auth();
  if (!session || session.user.rol !== "DOCENTE") {
    return { error: "No autorizado" };
  }

  const monitoriaId = formData.get("monitoriaId") as string;
  const semana = parseInt(formData.get("semana") as string);
  const contenido = formData.get("contenido") as string;
  const calificacionDesempeno = parseFloat(formData.get("calificacionDesempeno") as string);
  const observaciones = formData.get("observaciones") as string;

  if (!monitoriaId || isNaN(semana) || !contenido || isNaN(calificacionDesempeno)) {
    return { error: "Datos incompletos" };
  }

  if (calificacionDesempeno < 0 || calificacionDesempeno > 5) {
    return { error: "La calificación debe estar entre 0 y 5" };
  }

  try {
    const monitoria = await db.monitoria.findFirst({
      where: { id: monitoriaId, docenteId: session.user.docenteId! },
    });
    if (!monitoria) return { error: "Monitoría no encontrada" };

    // Verificar que no exista informe para esa semana
    const existente = await db.informeSeguimiento.findUnique({
      where: { monitoriaId_semana: { monitoriaId, semana } },
    });
    if (existente) return { error: "Ya existe un informe para esta semana" };

    await db.informeSeguimiento.create({
      data: {
        monitoriaId,
        docenteId: session.user.docenteId!,
        semana,
        contenido,
        calificacionDesempeno,
        observaciones: observaciones || null,
      },
    });

    // HU-30: Alerta automática si calificación baja
    if (calificacionDesempeno < 3) {
      const mon = await db.monitoria.findUnique({
        where: { id: monitoriaId },
        include: { monitor: { include: { estudiante: { include: { usuario: true } } } } },
      });
      if (mon) {
        await db.notificacion.create({
          data: {
            tipo: "ALERTA_INCUMPLIMIENTO",
            destinatarioCorreo: mon.monitor.estudiante.usuario.correo,
            mensaje: `Tu calificación de desempeño en la semana ${semana} fue ${calificacionDesempeno}/5. Por favor comunícate con tu docente.`,
            usuarioId: mon.monitor.estudiante.usuario.id,
          },
        });
      }
    }

    revalidatePath("/docente/seguimiento");
    return { success: true };
  } catch {
    return { error: "Error al registrar el informe" };
  }
}

// ─────────────────────────────────────────────
// HU-27: Consultar historial de desempeño (Docente)
// ─────────────────────────────────────────────
export async function obtenerMisMonitorias() {
  const session = await auth();
  if (!session || session.user.rol !== "DOCENTE") return [];

  return db.monitoria.findMany({
    where: { docenteId: session.user.docenteId! },
    include: {
      curso: true,
      monitor: {
        include: {
          estudiante: { include: { usuario: true } },
        },
      },
      registrosHoras: true,
      informesSeguimiento: { orderBy: { semana: "asc" } },
      evidencias: true,
    },
    orderBy: { fechaInicio: "desc" },
  });
}

// ─────────────────────────────────────────────
// HU-31: Recordatorios semanales (Notificación)
// ─────────────────────────────────────────────
export async function enviarRecordatoriosSemanales() {
  // Esta función sería llamada por un cron job
  const monitoriasActivas = await db.monitoria.findMany({
    where: { estado: "ACTIVA" },
    include: {
      monitor: { include: { estudiante: { include: { usuario: true } } } },
      curso: true,
    },
  });

  const notificaciones = monitoriasActivas.map((m) => ({
    tipo: "RECORDATORIO_SEMANAL" as const,
    destinatarioCorreo: m.monitor.estudiante.usuario.correo,
    mensaje: `Recuerda registrar tus horas de monitoría para el curso ${m.curso.nombre} esta semana.`,
    usuarioId: m.monitor.estudiante.usuario.id,
  }));

  if (notificaciones.length > 0) {
    await db.notificacion.createMany({ data: notificaciones });
  }

  return { success: true, enviadas: notificaciones.length };
}

// ─────────────────────────────────────────────
// HU-20 + HU-21 + HU-22: Gestión de candidatos con IA
// Completar asignación formal (Release 2)
// ─────────────────────────────────────────────
export async function completarAsignacionMonitor(postulacionId: string) {
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

    // Verificar que no tenga ya un Monitor creado
    const monitorExistente = await db.monitor.findUnique({
      where: { estudianteId: postulacion.estudianteId },
    });

    let monitor = monitorExistente;
    if (!monitor) {
      monitor = await db.monitor.create({
        data: { estudianteId: postulacion.estudianteId },
      });
    }

    // Crear la Monitoria
    const semestreActivo = new Date().getFullYear() + "-" + (new Date().getMonth() < 6 ? "1" : "2");

    await db.monitoria.create({
      data: {
        monitorId: monitor.id,
        cursoId: postulacion.convocatoria.cursoId,
        docenteId: session.user.docenteId!,
        postulacionId,
        semestreActivo,
        fechaInicio: new Date(),
        estado: "ACTIVA",
      },
    });

    revalidatePath("/docente/seguimiento");
    revalidatePath("/docente/revision");
    return { success: true };
  } catch {
    return { error: "Error al completar la asignación" };
  }
}
