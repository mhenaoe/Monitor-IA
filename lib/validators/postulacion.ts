import { z } from "zod";

export const postularseFase1Schema = z.object({
  convocatoriaId: z.string().min(1, "Convocatoria inválida"),
  respuestas: z.record(z.string(), z.string()).refine(
    (obj) => Object.keys(obj).length > 0,
    "Debes responder al menos una pregunta"
  ),
});

export const actualizarEstadoSchema = z.object({
  postulacionId: z.string().min(1),
  estado: z.enum(["ACEPTADO", "DENEGADO"]),
});

export type PostularseFase1Input = z.infer<typeof postularseFase1Schema>;
export type ActualizarEstadoInput = z.infer<typeof actualizarEstadoSchema>;