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
  FileText,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { postularseFase1, postularseFase2 } from "@/lib/actions/postulaciones";

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
  postulacionExistente?: {
    id: string;
    estado: string;
    faseActual: string;
    hojaDeVidaUrl?: string | null;
  } | null;
}

type ResultadoPostulacion =
  | { tipo: "exito" }
  | { tipo: "exito_fase2" }
  | { tipo: "rechazo"; criteriosFallidos: string[] }
  | { tipo: "error"; mensaje: string };

type RespuestasPreguntas = Record<number, string>;
type RespuestasCriterios = Record<string, string>;

export function PostulacionForm({
  convocatoriaId,
  preguntasFase1,
  criteriosManuales,
  postulacionExistente,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [respuestasPreguntas, setRespuestasPreguntas] = useState<RespuestasPreguntas>({});
  const [respuestasCriterios, setRespuestasCriterios] = useState<RespuestasCriterios>({});
  const [hojaDeVidaUrl, setHojaDeVidaUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoPostulacion | null>(null);

  // ─── Si ya está en APROBADA_FASE_1 → mostrar Fase 2 ───
  const esFase2 =
    postulacionExistente?.estado === "APROBADA_FASE_1" &&
    postulacionExistente?.faseActual === "FASE_1";

  // ─── Si ya subió HV ───
  const yaSubioHV = !!postulacionExistente?.hojaDeVidaUrl;

  const validar = (): string | null => {
    for (let i = 0; i < preguntasFase1.length; i++) {
      if (!respuestasPreguntas[i]?.trim()) return `Responde la pregunta ${i + 1}`;
      if ((respuestasPreguntas[i]?.trim().length ?? 0) < 10)
        return `La respuesta a la pregunta ${i + 1} debe tener al menos 10 caracteres`;
    }
    for (const c of criteriosManuales) {
      if (!respuestasCriterios[c.campo]?.trim())
        return `Responde el requisito: "${c.nombre}"`;
    }
    return null;
  };

  const handleSubmitFase1 = (e: React.FormEvent) => {
    e.preventDefault();
    const errorValidacion = validar();
    if (errorValidacion) { setError(errorValidacion); return; }
    setError(null);

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
        setResultado({ tipo: "rechazo", criteriosFallidos: res.criteriosFallidos });
        setTimeout(() => router.refresh(), 3500);
        return;
      }
      setResultado({ tipo: "error", mensaje: typeof res?.error === "string" ? res.error : "Error al postularte" });
    });
  };

  const handleSubmitFase2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hojaDeVidaUrl.trim()) { setError("Debes ingresar el enlace de tu hoja de vida"); return; }
    if (!hojaDeVidaUrl.startsWith("http")) { setError("El enlace debe comenzar con http:// o https://"); return; }
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("postulacionId", postulacionExistente!.id);
      formData.append("hojaDeVidaUrl", hojaDeVidaUrl.trim());
      const res = await postularseFase2(formData);
      if (res?.success) {
        setResultado({ tipo: "exito_fase2" });
        setTimeout(() => router.refresh(), 2500);
      } else {
        setError(typeof res?.error === "string" ? res.error : "Error al subir la hoja de vida");
      }
    });
  };

  if (resultado) return <ResultadoPantalla resultado={resultado} />;

  // ─── Fase 2: subir hoja de vida ───
  if (esFase2) {
    return (
      <form onSubmit={handleSubmitFase2} className="space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">2</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Fase 2 — Hoja de vida</h3>
          </div>
          <p className="text-xs text-gray-500 ml-7">
            ¡Pasaste la validación automática! Ahora sube tu hoja de vida para que el docente pueda evaluarte.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-800 font-medium">
            Fase 1 aprobada — Tu postulación inicial cumplió todos los requisitos.
          </p>
        </div>

        {yaSubioHV ? (
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 flex items-start gap-3">
            <FileText className="w-5 h-5 text-violet-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Hoja de vida enviada</p>
              <a
                href={postulacionExistente?.hojaDeVidaUrl ?? ""}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-violet-600 hover:underline"
              >
                Ver hoja de vida →
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-900">
                <span className="inline-flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-gray-400" />
                  Enlace a tu hoja de vida
                </span>
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="url"
                value={hojaDeVidaUrl}
                onChange={(e) => setHojaDeVidaUrl(e.target.value)}
                disabled={isPending}
                placeholder="https://drive.google.com/file/..."
                className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50"
              />
              <p className="text-[11px] text-gray-400">
                Sube tu HV a Google Drive o similar y pega el enlace aquí. Asegúrate de que sea público.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end pt-2 border-t border-gray-100">
              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</>
                ) : (
                  <><Upload className="w-4 h-4" />Enviar hoja de vida</>
                )}
              </Button>
            </div>
          </>
        )}
      </form>
    );
  }

  // ─── Fase 1: formulario normal ───
  return (
    <form onSubmit={handleSubmitFase1} className="space-y-5">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1">
          <Send className="w-4 h-4 text-violet-600" />
          Postúlate a esta convocatoria
        </h3>
        <p className="text-xs text-gray-500">
          Responde las siguientes preguntas. Serán enviadas al docente.
        </p>
      </div>

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
            onChange={(e) => setRespuestasPreguntas({ ...respuestasPreguntas, [idx]: e.target.value })}
            rows={3}
            disabled={isPending}
            placeholder="Escribe tu respuesta..."
            className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none disabled:opacity-50"
          />
          <p className="text-[11px] text-gray-400">Mínimo 10 caracteres.</p>
        </div>
      ))}

      {criteriosManuales.length > 0 && (
        <div className="pt-2 border-t border-gray-100 space-y-4">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Los siguientes requisitos se validarán automáticamente con tu respuesta.</span>
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
                onChange={(e) => setRespuestasCriterios({ ...respuestasCriterios, [c.campo]: e.target.value })}
                disabled={isPending}
                placeholder="Tu respuesta..."
                className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50"
              />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-end pt-2 border-t border-gray-100">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Enviando postulación...</>
          ) : (
            <><Send className="w-4 h-4" />Enviar postulación</>
          )}
        </Button>
      </div>
    </form>
  );
}

function ResultadoPantalla({ resultado }: { resultado: ResultadoPostulacion }) {
  if (resultado.tipo === "exito") {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">¡Postulación enviada!</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
          Pasaste la validación automática. El docente revisará tu perfil pronto.
        </p>
      </div>
    );
  }

  if (resultado.tipo === "exito_fase2") {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-violet-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">¡Hoja de vida enviada!</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
          Tu hoja de vida fue recibida. El docente la revisará y recibirás una notificación con el resultado.
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
        <h3 className="text-lg font-bold text-gray-900">No cumples los requisitos mínimos</h3>
        <p className="text-sm text-gray-500 mt-1 mb-4 max-w-md mx-auto">
          Tu postulación fue rechazada automáticamente por los siguientes criterios:
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
