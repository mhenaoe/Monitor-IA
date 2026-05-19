"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  FileText,
  Settings,
  Users,
  BarChart3,
  LayoutGrid,
  ClipboardList,
  Clock,
  Upload,
} from "lucide-react";

const docenteNav = [
  {
    label: "Convocatorias",
    href: "/docente/convocatorias",
    icon: FileText,
    disabled: false,
  },
  {
    label: "Criterios Fase I",
    href: "/docente/criterios",
    icon: Settings,
    disabled: false,
  },
  {
    label: "Revisión & Asignación",
    href: "/docente/revision",
    icon: Users,
    disabled: false,
  },
  {
    label: "Seguimiento",
    href: "/docente/seguimiento",
    icon: BarChart3,
    disabled: false,
  },
];

const estudianteNav = [
  {
    label: "Mural",
    href: "/estudiante/mural",
    icon: LayoutGrid,
    disabled: false,
  },
  {
    label: "Mis Postulaciones",
    href: "/estudiante/postulaciones",
    icon: ClipboardList,
    disabled: false,
  },
];

const monitorNav = [
  {
    label: "Mis Horas",
    href: "/monitor/horas",
    icon: Clock,
    disabled: false,
  },
  {
    label: "Evidencias",
    href: "/monitor/evidencias",
    icon: Upload,
    disabled: false,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isDocente = session?.user?.rol === "DOCENTE";
  const isMonitor = session?.user?.rol === "MONITOR";

  const navItems = isDocente ? docenteNav : isMonitor ? monitorNav : estudianteNav;

  const sectionTitle = isDocente
    ? "Sección Docente"
    : isMonitor
    ? "Sección Monitor"
    : "Sección Estudiante";

  const sectionDesc = isDocente
    ? "Gestión del proceso de selección y monitores."
    : isMonitor
    ? "Registra tus horas y sube evidencias de tu monitoría."
    : "Consulta convocatorias y gestiona tus postulaciones.";

  return (
    <aside className="w-72 flex-shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
        {/* Label superior */}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-widest">
            Panel de Control
          </span>
        </div>

        {/* Título de sección */}
        <h2 className="text-xl font-bold text-gray-900 leading-tight">
          {sectionTitle}
        </h2>
        <p className="text-xs text-gray-500 mt-1 mb-5 leading-relaxed">
          {sectionDesc}
        </p>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.disabled) {
              return (
                <div
                  key={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 rounded-lg cursor-not-allowed select-none"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-medium">
                    próximo
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all",
                  isActive
                    ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium shadow-md shadow-violet-500/30"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
