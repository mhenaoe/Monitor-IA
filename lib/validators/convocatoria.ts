import { z } from "zod";

export const crearConvocatoriaSchema = z.object({
  cursoId: z.string().min(1, "Selecciona un curso"),
  fechaInicio: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inválida"),
  fechaFin: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inválida"),
  preguntasFase1: z
    .array(
      z.object({
        pregunta: z.string().min(5, "La pregunta es muy corta"),
        tipo: z.enum(["texto", "numerico", "si_no"]),
      })
    )
    .min(1, "Agrega al menos una pregunta"),
});

export const crearCriterioSchema = z.object({
  convocatoriaId: z.string().min(1),
  nombre: z.string().min(3, "Nombre muy corto"),
  tipo: z.enum(["AUTOMATICO_SIS", "MANUAL"]),
  campo: z.string().min(1, "Selecciona un campo"),
  operador: z.enum([">=", "<=", "==", "!=", ">", "<"]),
  valor: z.string().min(1, "Define un valor"),
  fuente: z.enum(["SISTEMA_ACADEMICO", "FORMULARIO"]),
});

export type CrearConvocatoriaInput = z.infer<typeof crearConvocatoriaSchema>;
export type CrearCriterioInput = z.infer<typeof crearCriterioSchema>;