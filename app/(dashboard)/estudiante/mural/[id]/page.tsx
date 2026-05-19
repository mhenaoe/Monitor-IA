import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  User,
  Users,
  GraduationCap,
  ListChecks,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { obtenerDetalleConvocatoria } from "@/lib/actions/postulaciones";
import { PostulacionForm } from "./postulacion-form";

interface Props {
  params: Promise<{ id: string }>;
}

// ─── Config de estados (fuera del componente para evitar problemas de tipado) ───

type EstadoConfig = {
  icon: typeof CheckCircle2;
  color: "emerald" | "red" | "violet" | "blue" | "gray";
  titulo: string;
  mensaje: string;
};

const ESTADO_CONFIG: Record<string, EstadoConfig> = {
  ACEPTADO: {
    icon: CheckCircle2,
    color: "emerald",
    titulo: "¡Felicitaciones! Fuiste elegido",
    mensaje:
      "El docente te seleccionó como monitor de esta convocatoria. Recibirás información adicional por correo institucional.",
  },
  DENEGADO: {
    icon: XCircle,
    color: "red",
    titulo: "No fuiste seleccionado",
    mensaje:
      "En esta ocasión el docente eligió a otro candidato. Te animamos a postularte en futuras convocatorias.",
  },
  RECHAZADA: {
    icon: XCircle,
    color: "red",
    titulo: "No cumples los requisitos",
    mensaje:
      "Tu postulación fue rechazada automáticamente porque no cumple con alguno de los criterios mínimos.",
  },
  APROBADA_FASE_1: {
    icon: CheckCircle2,
    color: "violet",
    titulo: "Postulación recibida",
    mensaje:
      "Pasaste la validación automática. El docente revisará tu perfil pronto.",
  },
  APROBADA_FASE_2: {
    icon: CheckCircle2,
    color: "violet",
    titulo: "Avanzaste a Fase 2",
    mensaje: "El docente está evaluando tu hoja de vida.",
  },
  EN_PROCESO: {
    icon: Clock,
    color: "blue",
    titulo: "Postulación en proceso",
    mensaje: "Estamos validando tu postulación.",
  },
};

const CONFIG_DEFAULT: EstadoConfig = {
  icon: Info,
  color: "gray",
  titulo: "Estado desconocido",
  mensaje: "Contacta al administrador.",
};

const CONTAINER_COLORS: Record<EstadoConfig["color"], string> = {
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
  red: "bg-red-50 border-red-200 text-red-900",
  violet: "bg-violet-50 border-violet-200 text-violet-900",
  blue: "bg-blue-50 border-blue-200 text-blue-900",
  gray: "bg-gray-50 border-gray-200 text-gray-900",
};

const ICON_COLORS: Record<EstadoConfig["color"], string> = {
  emerald: "text-emerald-600",
  red: "text-red-600",
  violet: "text-violet-600",
  blue: "text-blue-600",
  gray: "text-gray-600",
};

// ─── Página principal ───

export default async function DetalleConvocatoriaPage({ params }: Props) {
  const { id } = await params;
  const conv = await obtenerDetalleConvocatoria(id);

  if (!conv) {
    notFound();
  }

  if (conv.estado !== "PUBLICADA") {
    redirect("/estudiante/mural");
  }

  const miPostulacion = conv.postulaciones[0] ?? null;
  const fechaPasada = new Date(conv.fechaFin) < new Date();

  // Parsear preguntas fase 1 del JSON
  const preguntasFase1 = Array.isArray(conv.preguntasFase1)
    ? (conv.preguntasFase1 as unknown as Array<{ pregunta: string; tipo: string }>)
    : [];

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        href="/estudiante/mural"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al mural
      </Link>

      {/* Card principal */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Header con gradient */}
        <div className="bg-gradient-to-br from-violet-500 via-violet-600 to-purple-600 p-6 sm:p-8 text-white">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-violet-100 mb-2">
            <GraduationCap className="w-4 h-4" />
            {conv.curso.codigo} · {conv.curso.programa}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
            {conv.curso.nombre}
          </h1>
          <p className="mt-2 text-sm text-violet-100">
            Convocatoria de monitoría · {conv.curso.semestre}
          </p>
        </div>

        {/* Info */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Si ya se postuló: mostrar estado */}
          {miPostulacion && (
            <EstadoPostulacionBox
              estado={miPostulacion.estado}
              fecha={miPostulacion.fechaPostulacion}
            />
          )}

          {/* Grid info general */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InfoItem
              icon={User}
              label="Docente a cargo"
              value={`${conv.docente.usuario.nombre} ${conv.docente.usuario.apellido}`}
              subvalue={conv.docente.departamento}
            />
            <InfoItem
              icon={Calendar}
              label="Fecha de cierre"
              value={formatearFechaLarga(conv.fechaFin)}
              subvalue={
                fechaPasada
                  ? "Convocatoria cerrada"
                  : `${calcularDiasRestantes(conv.fechaFin)} días restantes`
              }
              highlight={fechaPasada ? "danger" : undefined}
            />
            <InfoItem
              icon={Users}
              label="Postulados hasta ahora"
              value={`${conv.postulaciones.length}`}
              subvalue="en esta convocatoria"
            />
          </div>

          {/* Requisitos */}
          {conv.criterios.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                <ListChecks className="w-4 h-4 text-violet-600" />
                Requisitos para postularte
              </h3>
              <div className="space-y-2">
                {conv.criterios.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-2 text-sm text-gray-600 p-3 rounded-lg bg-gray-50/60"
                  >
                    <CheckCircle2 className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-gray-900">
                        {c.nombre}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {describirCriterio(c)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulario de postulación */}
          {!miPostulacion && !fechaPasada && (
            <div className="pt-4 border-t border-gray-100">
              <PostulacionForm
                convocatoriaId={conv.id}
                preguntasFase1={preguntasFase1}
                criteriosManuales={conv.criterios
                  .filter((c) => c.tipo === "MANUAL")
                  .map((c) => ({
                    id: c.id,
                    campo: c.campo,
                    nombre: c.nombre,
                    operador: c.operador,
                    valor: c.valor,
                  }))}
              />
            </div>
          )}

          {/* Convocatoria cerrada sin postulación */}
          {!miPostulacion && fechaPasada && (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Esta convocatoria ya cerró
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    La fecha de cierre fue el{" "}
                    {formatearFechaLarga(conv.fechaFin)}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Estado de postulación existente ───

function EstadoPostulacionBox({
  estado,
  fecha,
}: {
  estado: string;
  fecha: Date | string;
}) {
  const config = ESTADO_CONFIG[estado] ?? CONFIG_DEFAULT;
  const Icon = config.icon;
  const fechaStr = formatearFechaLarga(fecha);

  return (
    <div
      className={`flex items-start gap-3 rounded-xl p-4 border ${CONTAINER_COLORS[config.color]}`}
    >
      <Icon className={`w-5 h-5 ${ICON_COLORS[config.color]} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        <p className="text-sm font-semibold">{config.titulo}</p>
        <p className="text-xs mt-0.5 opacity-80">{config.mensaje}</p>
        <p className="text-[11px] mt-2 opacity-60">
          Te postulaste el {fechaStr}
        </p>
      </div>
    </div>
  );
}

// ─── Info item reutilizable ───

function InfoItem({
  icon: Icon,
  label,
  value,
  subvalue,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subvalue?: string;
  highlight?: "danger";
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <p
        className={`text-sm font-semibold ${
          highlight === "danger" ? "text-red-600" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      {subvalue && (
        <p className="text-[11px] text-gray-500 mt-0.5">{subvalue}</p>
      )}
    </div>
  );
}

// ─── Helpers ───

function formatearFechaLarga(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return d.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function calcularDiasRestantes(fechaFin: Date | string): number {
  const fin = typeof fechaFin === "string" ? new Date(fechaFin) : fechaFin;
  const hoy = new Date();
  const diff = fin.getTime() - hoy.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function describirCriterio(c: {
  tipo: string;
  campo: string;
  operador: string;
  valor: string;
}): string {
  const campoMap: Record<string, string> = {
    promedioAcumulado: "Promedio acumulado",
    semestre: "Semestre",
    creditosAprobados: "Créditos aprobados",
  };
  const opMap: Record<string, string> = {
    ">=": "mayor o igual a",
    "<=": "menor o igual a",
    "==": "igual a",
    "!=": "diferente de",
    ">": "mayor que",
    "<": "menor que",
  };

  if (c.tipo === "AUTOMATICO_SIS") {
    return `${campoMap[c.campo] ?? c.campo} ${opMap[c.operador] ?? c.operador} ${c.valor}`;
  }
  return `Respuesta esperada: ${opMap[c.operador] ?? c.operador} "${c.valor}"`;
}