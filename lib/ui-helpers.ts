import { CheckCircle2, Clock, XCircle, type LucideIcon } from "lucide-react";
import type { EstadoPostulacion } from "@prisma/client";

type BadgeVariant =
  | "default"
  | "borrador"
  | "publicada"
  | "cerrada"
  | "aceptado"
  | "rechazada"
  | "info"
  | "warning";

export interface EstadoPostulacionInfo {
  variant: BadgeVariant;
  label: string;
  Icon: LucideIcon;
  categoria: "activa" | "aceptada" | "rechazada";
}

export const ESTADO_POSTULACION_INFO: Record<EstadoPostulacion, EstadoPostulacionInfo> = {
  EN_PROCESO: {
    variant: "info",
    label: "En proceso",
    Icon: Clock,
    categoria: "activa",
  },
  APROBADA_FASE_1: {
    variant: "info",
    label: "Fase 1 aprobada",
    Icon: CheckCircle2,
    categoria: "activa",
  },
  APROBADA_FASE_2: {
    variant: "info",
    label: "Fase 2 aprobada",
    Icon: CheckCircle2,
    categoria: "activa",
  },
  ACEPTADO: {
    variant: "aceptado",
    label: "Elegido",
    Icon: CheckCircle2,
    categoria: "aceptada",
  },
  DENEGADO: {
    variant: "rechazada",
    label: "No seleccionado",
    Icon: XCircle,
    categoria: "rechazada",
  },
  RECHAZADA: {
    variant: "rechazada",
    label: "No cumple requisitos",
    Icon: XCircle,
    categoria: "rechazada",
  },
};