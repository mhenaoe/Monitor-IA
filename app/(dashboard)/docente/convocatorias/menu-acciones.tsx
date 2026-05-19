"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MoreVertical,
  Send,
  Lock,
  Eye,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { EstadoConvocatoria } from "@prisma/client";
import {
  publicarConvocatoria,
  cerrarConvocatoria,
} from "@/lib/actions/convocatorias";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  estado: EstadoConvocatoria;
  tieneCriterios: boolean;
}

export function MenuAcciones({ id, estado, tieneCriterios }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!abierto) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [abierto]);

  // Cerrar con ESC
  useEffect(() => {
    if (!abierto) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [abierto]);

  const handlePublicar = () => {
    setAbierto(false);
    setError(null);

    if (!tieneCriterios) {
      setError("Debes agregar al menos un criterio antes de publicar");
      setTimeout(() => setError(null), 4000);
      return;
    }

    startTransition(async () => {
      const res = await publicarConvocatoria(id);
      if (res?.error) {
        setError(res.error);
        setTimeout(() => setError(null), 4000);
      } else {
        router.refresh();
      }
    });
  };

  const handleCerrar = () => {
    setAbierto(false);
    if (
      !confirm(
        "¿Cerrar esta convocatoria? No podrás recibir más postulaciones."
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await cerrarConvocatoria(id);
      if (res?.error) {
        setError(res.error);
        setTimeout(() => setError(null), 4000);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Indicador de error flotante */}
      {error && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-red-50 text-red-700 text-xs px-2.5 py-1 rounded-md border border-red-200 whitespace-nowrap z-10">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}

      {/* Botón trigger */}
      <button
        onClick={() => setAbierto((v) => !v)}
        disabled={isPending}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          "text-gray-400 hover:text-gray-700 hover:bg-gray-100",
          "disabled:opacity-50 disabled:pointer-events-none",
          abierto && "bg-gray-100 text-gray-700"
        )}
        aria-label="Acciones"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MoreVertical className="w-4 h-4" />
        )}
      </button>

      {/* Menú dropdown */}
      {abierto && (
        <div
          className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-gray-100 shadow-lg py-1.5 z-20"
          role="menu"
        >
          {/* Acción principal según estado */}
          {estado === "BORRADOR" && (
            <MenuItem onClick={handlePublicar} icon={Send} variant="primary">
              Publicar
            </MenuItem>
          )}

          {estado === "PUBLICADA" && (
            <>
              <MenuItem
                as={Link}
                href={`/docente/revision?convocatoria=${id}`}
                icon={Users}
              >
                Ver candidatos
              </MenuItem>
              <MenuItem onClick={handleCerrar} icon={Lock} variant="danger">
                Cerrar convocatoria
              </MenuItem>
            </>
          )}

          {estado === "CERRADA" && (
            <MenuItem
              as={Link}
              href={`/docente/revision?convocatoria=${id}`}
              icon={Eye}
            >
              Ver candidatos
            </MenuItem>
          )}

          {/* Separador + detalle (siempre disponible) */}
          <div className="h-px bg-gray-100 my-1" />
          <MenuItem
            as={Link}
            href={`/docente/criterios?convocatoria=${id}`}
            icon={Eye}
          >
            Ver detalles
          </MenuItem>
        </div>
      )}
    </div>
  );
}

// ───── MenuItem helper ─────

type MenuItemProps = {
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "primary" | "danger";
} & (
  | { onClick: () => void; as?: undefined; href?: undefined }
  | { as: typeof Link; href: string; onClick?: undefined }
);

function MenuItem({
  children,
  icon: Icon,
  variant = "default",
  onClick,
  as: Component,
  href,
}: MenuItemProps) {
  const classes = cn(
    "flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-md transition-colors text-left",
    {
      "text-gray-700 hover:bg-gray-50": variant === "default",
      "text-violet-700 hover:bg-violet-50 font-medium": variant === "primary",
      "text-red-600 hover:bg-red-50": variant === "danger",
    }
  );

  const content = (
    <>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{children}</span>
    </>
  );

  if (Component && href) {
    return (
      <Component href={href} className={classes}>
        {content}
      </Component>
    );
  }

  return (
    <button onClick={onClick} className={classes} role="menuitem">
      {content}
    </button>
  );
}