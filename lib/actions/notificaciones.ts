"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// ─────────────────────────────────────────────
// Obtener mis notificaciones
// ─────────────────────────────────────────────
export async function obtenerMisNotificaciones() {
  const session = await auth();
  if (!session) return [];

  return db.notificacion.findMany({
    where: { usuarioId: session.user.id },
    orderBy: { creadoEn: "desc" },
    take: 20,
  });
}

// ─────────────────────────────────────────────
// Contar notificaciones pendientes
// ─────────────────────────────────────────────
export async function contarNotificacionesPendientes() {
  const session = await auth();
  if (!session) return 0;

  return db.notificacion.count({
    where: { usuarioId: session.user.id, estado: "PENDIENTE" },
  });
}

// ─────────────────────────────────────────────
// Marcar como enviada (para cuando se envía por correo real)
// ─────────────────────────────────────────────
export async function marcarComoEnviada(notificacionId: string) {
  return db.notificacion.update({
    where: { id: notificacionId },
    data: {
      estado: "ENVIADA",
      fechaEnvio: new Date(),
    },
  });
}

// ─────────────────────────────────────────────
// Obtener notificaciones pendientes de envío (para cron job futuro)
// ─────────────────────────────────────────────
export async function obtenerPendientesDeEnvio() {
  return db.notificacion.findMany({
    where: { estado: "PENDIENTE" },
    take: 50,
    orderBy: { creadoEn: "asc" },
  });
}