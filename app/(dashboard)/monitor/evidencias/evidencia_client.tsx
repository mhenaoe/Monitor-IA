"use client";

import { useState, useTransition } from "react";
import { subirEvidencia } from "@/lib/actions/seguimiento";
import { FileText, Image, Video, BookOpen, Plus, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const TIPOS_EVIDENCIA = [
  { value: "FOTO", label: "Foto", icon: Image },
  { value: "VIDEO", label: "Video", icon: Video },
  { value: "DOCUMENTO", label: "Documento", icon: FileText },
  { value: "TALLER", label: "Taller", icon: BookOpen },
  { value: "MATERIAL_ESTUDIO", label: "Material de estudio", icon: BookOpen },
];

interface Evidencia {
  id: string;
  tipo: string;
  archivoUrl: string;
  fechaSubida: string;
  descripcion: string | null;
}

interface Props {
  monitoria: {
    id: string;
    curso: { nombre: string };
    evidencias: Evidencia[];
  };
}

export function EvidenciasClient({ monitoria }: Props) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState("DOCUMENTO");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("monitoriaId", monitoria.id);
    formData.set("tipo", tipoSeleccionado);

    startTransition(async () => {
      const res = await subirEvidencia(formData);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setMostrarFormulario(false);
        form.reset();
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  const iconPorTipo = (tipo: string) => {
    const found = TIPOS_EVIDENCIA.find((t) => t.value === tipo);
    const Icon = found?.icon ?? FileText;
    return <Icon className="w-4 h-4 text-violet-500" />;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {monitoria.evidencias.length} evidencia{monitoria.evidencias.length !== 1 ? "s" : ""} subida{monitoria.evidencias.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Subir evidencia
        </button>
      </div>

      {/* Formulario */}
      {mostrarFormulario && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-violet-100 bg-violet-50/50 p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-gray-900">Nueva evidencia</h3>

          {/* Selector de tipo */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Tipo de evidencia</label>
            <div className="flex flex-wrap gap-2">
              {TIPOS_EVIDENCIA.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipoSeleccionado(t.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all",
                    tipoSeleccionado === t.value
                      ? "bg-violet-500 text-white border-violet-500"
                      : "border-gray-200 text-gray-600 hover:border-violet-300"
                  )}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">URL del archivo</label>
            <input
              name="archivoUrl"
              type="url"
              required
              placeholder="https://drive.google.com/..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Sube el archivo a Google Drive u otro servicio y pega el enlace aquí.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descripción (opcional)</label>
            <textarea
              name="descripcion"
              rows={2}
              placeholder="Breve descripción de la evidencia..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
            />
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" /> {error}
            </p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setMostrarFormulario(false)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-1.5 text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors font-medium disabled:opacity-50"
            >
              {isPending ? "Subiendo..." : "Guardar evidencia"}
            </button>
          </div>
        </form>
      )}

      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2.5">
          <CheckCircle className="w-4 h-4" /> Evidencia registrada correctamente.
        </div>
      )}

      {/* Lista de evidencias */}
      {monitoria.evidencias.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400">
          No has subido evidencias aún. ¡Documenta tu trabajo como monitor!
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {monitoria.evidencias.map((ev) => (
            <div
              key={ev.id}
              className="rounded-xl border border-gray-100 p-4 flex items-start gap-3 hover:border-violet-100 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 flex-shrink-0">
                {iconPorTipo(ev.tipo)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-wide">
                    {ev.tipo.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-gray-700 truncate">
                  {ev.descripcion ?? "Sin descripción"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(ev.fechaSubida).toLocaleDateString("es-CO")}
                </p>
              </div>
              <a
                href={ev.archivoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-gray-400 hover:text-violet-500 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
