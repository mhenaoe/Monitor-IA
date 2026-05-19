"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Loader2, Cpu, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { agregarCriterio } from "@/lib/actions/convocatorias";
import { cn } from "@/lib/utils";

interface Props {
  convocatoriaId: string;
  onSuccess: () => void;
  onCancel: () => void;
  puedeCancel: boolean;
}

type TipoCriterio = "AUTOMATICO_SIS" | "MANUAL";

// Campos disponibles para criterios automáticos (provienen del SA)
const CAMPOS_AUTOMATICOS = [
  { value: "promedioAcumulado", label: "Promedio acumulado", tipo: "decimal" },
  { value: "semestre", label: "Semestre actual", tipo: "entero" },
  {
    value: "creditosAprobados",
    label: "Créditos aprobados",
    tipo: "entero",
  },
] as const;

const OPERADORES_AUTOMATICOS = [
  { value: ">=", label: "Mayor o igual a (≥)" },
  { value: "<=", label: "Menor o igual a (≤)" },
  { value: ">", label: "Mayor que (>)" },
  { value: "<", label: "Menor que (<)" },
  { value: "==", label: "Igual a (=)" },
  { value: "!=", label: "Diferente de (≠)" },
] as const;

const OPERADORES_MANUALES = [
  { value: "==", label: "Igual a (=)" },
  { value: "!=", label: "Diferente de (≠)" },
] as const;

export function CriterioForm({
  convocatoriaId,
  onSuccess,
  onCancel,
  puedeCancel,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [tipo, setTipo] = useState<TipoCriterio | null>(null);
  const [nombre, setNombre] = useState("");
  const [campo, setCampo] = useState("");
  const [operador, setOperador] = useState("");
  const [valor, setValor] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTipo(null);
    setNombre("");
    setCampo("");
    setOperador("");
    setValor("");
    setError(null);
  };

  const validar = (): string | null => {
    if (!tipo) return "Selecciona un tipo de criterio";
    if (nombre.trim().length < 3) return "El nombre debe tener al menos 3 caracteres";
    if (!campo) {
      return tipo === "AUTOMATICO_SIS"
        ? "Selecciona un campo del sistema"
        : "Escribe un identificador para la pregunta";
    }
    if (!operador) return "Selecciona un operador";
    if (!valor.trim()) return "Escribe el valor de comparación";
    // Validación de tipo numérico para campos automáticos
    if (tipo === "AUTOMATICO_SIS") {
      const num = parseFloat(valor);
      if (isNaN(num)) return "El valor debe ser un número";
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validar();
    if (err) {
      setError(err);
      return;
    }
    setError(null);

    const fuente =
      tipo === "AUTOMATICO_SIS" ? "SISTEMA_ACADEMICO" : "FORMULARIO";

    const formData = new FormData();
    formData.append("convocatoriaId", convocatoriaId);
    formData.append("nombre", nombre.trim());
    formData.append("tipo", tipo!);
    formData.append("campo", campo);
    formData.append("operador", operador);
    formData.append("valor", valor.trim());
    formData.append("fuente", fuente);

    startTransition(async () => {
      const res = await agregarCriterio(formData);
      if (res?.error) {
        setError(
          typeof res.error === "string"
            ? res.error
            : "Error al crear el criterio"
        );
        return;
      }
      reset();
      onSuccess();
    });
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  // ─── Paso inicial: selección de tipo ───
  if (!tipo) {
    return (
      <div className="rounded-xl border border-gray-200 p-5 bg-gray-50/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Nuevo criterio
          </h3>
          {puedeCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="p-1 text-gray-400 hover:text-gray-700 rounded transition"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Elige cómo se validará este requisito.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TipoCard
            icon={Cpu}
            titulo="Automático"
            descripcion="Validado contra el Sistema Académico (promedio, semestre, créditos)."
            onClick={() => setTipo("AUTOMATICO_SIS")}
            acento="violet"
          />
          <TipoCard
            icon={Pencil}
            titulo="Manual"
            descripcion="Pregunta con respuesta esperada que responde el estudiante."
            onClick={() => setTipo("MANUAL")}
            acento="teal"
          />
        </div>
      </div>
    );
  }

  // ─── Formulario según tipo ───
  const esAutomatico = tipo === "AUTOMATICO_SIS";
  const operadores = esAutomatico ? OPERADORES_AUTOMATICOS : OPERADORES_MANUALES;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 p-5 bg-gray-50/50 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {esAutomatico ? (
            <Cpu className="w-4 h-4 text-violet-600" />
          ) : (
            <Pencil className="w-4 h-4 text-teal-600" />
          )}
          <h3 className="text-sm font-semibold text-gray-900">
            Nuevo criterio {esAutomatico ? "automático" : "manual"}
          </h3>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="p-1 text-gray-400 hover:text-gray-700 rounded transition"
          aria-label="Cerrar"
          disabled={isPending}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nombre */}
      <div>
        <Label>Nombre del criterio</Label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={
            esAutomatico
              ? "Ej: Promedio acumulado mínimo"
              : "Ej: ¿Ha cursado Estructuras de Datos?"
          }
          className={inputClasses}
          disabled={isPending}
        />
      </div>

      {/* Campo */}
      <div>
        <Label>
          {esAutomatico
            ? "Campo del Sistema Académico"
            : "Identificador de la pregunta"}
        </Label>
        {esAutomatico ? (
          <select
            value={campo}
            onChange={(e) => setCampo(e.target.value)}
            className={inputClasses}
            disabled={isPending}
          >
            <option value="">— Selecciona un campo —</option>
            {CAMPOS_AUTOMATICOS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={campo}
            onChange={(e) =>
              setCampo(e.target.value.replace(/\s+/g, "_").toLowerCase())
            }
            placeholder="Ej: cursoEstructuras (sin espacios)"
            className={inputClasses}
            disabled={isPending}
          />
        )}
        {!esAutomatico && (
          <p className="text-[11px] text-gray-400 mt-1">
            Identificador único para esta pregunta. Sin espacios.
          </p>
        )}
      </div>

      {/* Operador y Valor en la misma fila */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Operador</Label>
          <select
            value={operador}
            onChange={(e) => setOperador(e.target.value)}
            className={inputClasses}
            disabled={isPending}
          >
            <option value="">— Selecciona —</option>
            {operadores.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Valor</Label>
          <input
            type={esAutomatico ? "number" : "text"}
            step={esAutomatico ? "0.01" : undefined}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={esAutomatico ? "Ej: 4.0" : "Ej: Sí"}
            className={inputClasses}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg border border-red-200">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setTipo(null)}
          disabled={isPending}
          className="text-xs text-gray-500 hover:text-gray-900 transition px-3 py-2 disabled:opacity-50"
        >
          ← Cambiar tipo
        </button>
        <Button type="submit" variant="primary" size="sm" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Guardando...
            </>
          ) : (
            "Agregar criterio"
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Sub-componente: Card de selección de tipo ───

interface TipoCardProps {
  icon: React.ComponentType<{ className?: string }>;
  titulo: string;
  descripcion: string;
  onClick: () => void;
  acento: "violet" | "teal";
}

function TipoCard({
  icon: Icon,
  titulo,
  descripcion,
  onClick,
  acento,
}: TipoCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left p-4 rounded-xl border-2 transition-all group",
        "border-gray-200 bg-white hover:shadow-sm",
        acento === "violet" && "hover:border-violet-300 hover:bg-violet-50/30",
        acento === "teal" && "hover:border-teal-300 hover:bg-teal-50/30"
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition",
          acento === "violet" &&
            "bg-violet-50 text-violet-600 group-hover:bg-violet-100",
          acento === "teal" &&
            "bg-teal-50 text-teal-600 group-hover:bg-teal-100"
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-gray-900">{titulo}</h4>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
        {descripcion}
      </p>
    </button>
  );
}

// ─── Helpers de estilos ───

const inputClasses =
  "w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
      {children}
    </label>
  );
}