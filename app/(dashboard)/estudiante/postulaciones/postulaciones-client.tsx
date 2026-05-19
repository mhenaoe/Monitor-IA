"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  User,
  GraduationCap,
  ArrowRight,
  Clock,
} from "lucide-react";
import type { EstadoPostulacion, EstadoConvocatoria } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { ESTADO_POSTULACION_INFO } from "@/lib/ui-helpers";
import { cn } from "@/lib/utils";

interface PostulacionItem {
  id: string;
  estado: EstadoPostulacion;
  faseActual: string;
  fechaPostulacion: Date;
  convocatoria: {
    id: string;
    estado: EstadoConvocatoria;
    fechaFin: Date;
    curso: {
      nombre: string;
      codigo: string;
      semestre: string;
    };
    docente: {
      nombre: string;
    };
  };
}

type Categoria = "activa" | "aceptada" | "rechazada";

interface Props {
  postulaciones: PostulacionItem[];
}

export function PostulacionesClient({ postulaciones }: Props) {
  const [categoriaActiva, setCategoriaActiva] = useState<Categoria>("activa");

  // Contar por categoría
  const conteos = useMemo(() => {
    const c: Record<Categoria, number> = {
      activa: 0,
      aceptada: 0,
      rechazada: 0,
    };
    postulaciones.forEach((p) => {
      const cat = ESTADO_POSTULACION_INFO[p.estado].categoria;
      c[cat]++;
    });
    return c;
  }, [postulaciones]);

  // Filtrar por categoría activa
  const filtradas = useMemo(() => {
    return postulaciones.filter(
      (p) => ESTADO_POSTULACION_INFO[p.estado].categoria === categoriaActiva
    );
  }, [postulaciones, categoriaActiva]);

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 p-1.5 inline-flex items-center gap-1">
        <TabButton
          active={categoriaActiva === "activa"}
          onClick={() => setCategoriaActiva("activa")}
          count={conteos.activa}
        >
          Activas
        </TabButton>
        <TabButton
          active={categoriaActiva === "aceptada"}
          onClick={() => setCategoriaActiva("aceptada")}
          count={conteos.aceptada}
          tono="aceptado"
        >
          Aceptadas
        </TabButton>
        <TabButton
          active={categoriaActiva === "rechazada"}
          onClick={() => setCategoriaActiva("rechazada")}
          count={conteos.rechazada}
          tono="rechazada"
        >
          Rechazadas
        </TabButton>
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <EstadoCategoriaVacia categoria={categoriaActiva} />
      ) : (
        <div className="space-y-3">
          {filtradas.map((p) => (
            <PostulacionCard key={p.id} postulacion={p} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab button ───

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
  tono?: "aceptado" | "rechazada";
}

function TabButton({ active, onClick, count, children, tono }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative px-4 py-2 text-sm font-medium rounded-lg transition-all",
        active
          ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-sm shadow-violet-500/30"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <span>{children}</span>
      <span
        className={cn(
          "ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-bold rounded-full",
          active && "bg-white/20 text-white",
          !active && tono === "aceptado" && "bg-emerald-100 text-emerald-700",
          !active && tono === "rechazada" && "bg-red-100 text-red-700",
          !active && !tono && "bg-gray-100 text-gray-600"
        )}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Card individual ───

function PostulacionCard({ postulacion }: { postulacion: PostulacionItem }) {
  const info = ESTADO_POSTULACION_INFO[postulacion.estado];
  const Icon = info.Icon;
  const convocatoria = postulacion.convocatoria;
  const convCerrada = convocatoria.estado === "CERRADA";

  return (
    <Link
      href={`/estudiante/mural/${convocatoria.id}`}
      className={cn(
        "group block bg-white rounded-xl border border-gray-100 p-5 transition-all",
        "hover:border-violet-200 hover:shadow-md hover:shadow-violet-100/50",
        info.categoria === "aceptada" && "border-emerald-100 bg-emerald-50/20",
        info.categoria === "rechazada" && "opacity-80"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icono grande */}
        <div
          className={cn(
            "flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center",
            info.categoria === "activa" && "bg-violet-50 text-violet-600",
            info.categoria === "aceptada" && "bg-emerald-50 text-emerald-600",
            info.categoria === "rechazada" && "bg-red-50 text-red-600"
          )}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Contenido principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-violet-600 uppercase tracking-wider mb-1">
                <GraduationCap className="w-3 h-3" />
                {convocatoria.curso.codigo}
              </div>
              <h3 className="font-bold text-gray-900 text-base leading-tight">
                {convocatoria.curso.nombre}
              </h3>
            </div>
            <Badge variant={info.variant}>
              <Icon className="w-3 h-3 inline mr-1" />
              {info.label}
            </Badge>
          </div>

          {/* Info secundaria */}
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <User className="w-3 h-3" />
              {convocatoria.docente.nombre}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Postulado el {formatearFecha(postulacion.fechaPostulacion)}
            </span>
            {!convCerrada && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Cierra {formatearFecha(convocatoria.fechaFin)}
              </span>
            )}
            {convCerrada && (
              <Badge variant="cerrada">Convocatoria cerrada</Badge>
            )}
          </div>
        </div>

        {/* Flecha */}
        <ArrowRight className="flex-shrink-0 w-4 h-4 text-gray-300 group-hover:text-violet-600 group-hover:translate-x-1 transition-all mt-2" />
      </div>
    </Link>
  );
}

// ─── Estado categoría vacía ───

function EstadoCategoriaVacia({ categoria }: { categoria: Categoria }) {
  const mensajes = {
    activa: {
      titulo: "No tienes postulaciones activas",
      descripcion: "Postúlate a una convocatoria desde el mural.",
    },
    aceptada: {
      titulo: "Aún no has sido elegido",
      descripcion:
        "Cuando un docente te seleccione como monitor, aparecerá aquí.",
    },
    rechazada: {
      titulo: "Sin postulaciones rechazadas",
      descripcion: "¡Buena noticia! Ninguna de tus postulaciones fue rechazada.",
    },
  };

  const { titulo, descripcion } = mensajes[categoria];

  return (
    <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
      <h3 className="text-sm font-semibold text-gray-900">{titulo}</h3>
      <p className="mt-1 text-xs text-gray-500">{descripcion}</p>
    </div>
  );
}

// ─── Helper ───

function formatearFecha(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
