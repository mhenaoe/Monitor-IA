"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { postularseFase1 } from "@/lib/actions/postulaciones";

interface Pregunta {
  pregunta: string;
  tipo: string;
}

interface CriterioManual {
  id: string;
  campo: string;
  nombre: string;
  operador: string;
  valor: string;
}

interface Props {
  convocatoriaId: string;
  preguntasFase1: Pregunta[];
  criteriosManuales: CriterioManual[];
}

type ResultadoPostulacion =
  | { tipo: "exito" }
  | { tipo: "rechazo"; criteriosFallidos: string[] }
  | { tipo: "error"; mensaje: string };

type RespuestasPreguntas = Record<number, string>;
type RespuestasCriterios = Record<string, string>;

export function PostulacionForm({
  convocatoriaId,
  preguntasFase1,
  criteriosManuales,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [respuestasPreguntas, setRespuestasPreguntas] = useState<RespuestasPreguntas>({});
  const [respuestasCriterios, setRespuestasCriterios] = useState<RespuestasCriterios>({});
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoPostulacion | null>(null);

  const validar = (): string | null => {
    // Todas las preguntas Fase 1 son obligatorias
    for (let i = 0; i < preguntasFase1.length; i++) {
      if (!respuestasPreguntas[i]?.trim()) {
        return `Responde la pregunta ${i + 1}`;
      }
      if ((respuestasPreguntas[i]?.trim().length ?? 0) < 10) {
        return `La respuesta a la pregunta ${i + 1} debe tener al menos 10 caracteres`;
      }
    }
    // Todos los criterios manuales son obligatorios
    for (const c of criteriosManuales) {
      if (!respuestasCriterios[c.campo]?.trim()) {
        return `Responde el requisito: "${c.nombre}"`;
      }
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errorValidacion = validar();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }
    setError(null);

    // Consolidar todas las respuestas
    const respuestasFinales: Record<string, string> = {};

    preguntasFase1.forEach((p, idx) => {
      respuestasFinales[`pregunta_${idx}`] = respuestasPreguntas[idx].trim();
    });

    criteriosManuales.forEach((c) => {
      respuestasFinales[c.campo] = respuestasCriterios[c.campo].trim();
    });

    startTransition(async () => {
      const res = await postularseFase1(convocatoriaId, respuestasFinales);

      if (res?.success) {
        setResultado({ tipo: "exito" });
        setTimeout(() => router.refresh(), 2500);
        return;
      }

      if (res?.bloqueado && res.criteriosFallidos) {
        setResultado({
          tipo: "rechazo",
          criteriosFallidos: res.criteriosFallidos,
        });
        setTimeout(() => router.refresh(), 3500);
        return;
      }

      setResultado({
        tipo: "error",
        mensaje: typeof res?.error === "string" ? res.error : "Error al postularte",
      });
    });
  };

  // ─── Pantalla de resultado ───
  if (resultado) {
    return <ResultadoPantalla resultado={resultado} />;
  }

  // ─── Formulario ───
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1">
          <Send className="w-4 h-4 text-violet-600" />
          Postúlate a esta convocatoria
        </h3>
        <p className="text-xs text-gray-500">
          Responde las siguientes preguntas. Serán enviadas al docente.
        </p>
      </div>

      {/* Preguntas Fase 1 (abiertas) */}
      {preguntasFase1.map((p, idx) => (
        <div key={idx} className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-900">
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
              {idx + 1}. {p.pregunta}
            </span>
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            value={respuestasPreguntas[idx] ?? ""}
            onChange={(e) =>
              setRespuestasPreguntas({
                ...respuestasPreguntas,
                [idx]: e.target.value,
              })
            }
            rows={3}
            disabled={isPending}
            placeholder="Escribe tu respuesta..."
            className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none disabled:opacity-50"
          />
          <p className="text-[11px] text-gray-400">Mínimo 10 caracteres.</p>
        </div>
      ))}

      {/* Criterios manuales */}
      {criteriosManuales.length > 0 && (
        <div className="pt-2 border-t border-gray-100 space-y-4">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Los siguientes requisitos se validarán automáticamente con tu
              respuesta. Asegúrate de responder con precisión.
            </span>
          </div>

          {criteriosManuales.map((c) => (
            <div key={c.id} className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-900">
                <span className="inline-flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                  {c.nombre}
                </span>
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={respuestasCriterios[c.campo] ?? ""}
                onChange={(e) =>
                  setRespuestasCriterios({
                    ...respuestasCriterios,
                    [c.campo]: e.target.value,
                  })
                }
                disabled={isPending}
                placeholder="Tu respuesta..."
                className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50"
              />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end pt-2 border-t border-gray-100">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando postulación...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar postulación
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Pantalla de resultado ───

function ResultadoPantalla({ resultado }: { resultado: ResultadoPostulacion }) {
  if (resultado.tipo === "exito") {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">
          ¡Postulación enviada!
        </h3>
        <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
          Pasaste la validación automática. El docente revisará tu perfil
          pronto y recibirás una notificación con el resultado.
        </p>
      </div>
    );
  }

  if (resultado.tipo === "rechazo") {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">
          No cumples los requisitos mínimos
        </h3>
        <p className="text-sm text-gray-500 mt-1 mb-4 max-w-md mx-auto">
          Tu postulación fue rechazada automáticamente por los siguientes
          criterios:
        </p>
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-xl p-4 text-left">
          <ul className="space-y-2 text-sm text-red-800">
            {resultado.criteriosFallidos.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{resultado.mensaje}</span>
    </div>
  );
}