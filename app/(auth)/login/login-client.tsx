"use client";

import { useRouter } from "next/navigation";
import {
  GraduationCap,
  ArrowRight,
  Plus,
  BookOpen,
  Users,
} from "lucide-react";

interface LoginClientProps {
  stats: {
    convocatoriasActivas: number;
    estudiantesPostulados: number;
    monitoresAsignados: number;
  };
}

export function LoginClient({ stats }: LoginClientProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/50 relative overflow-hidden">
      {/* Navbar pill */}
      <nav className="sticky top-4 z-50 mx-4 sm:mx-8">
        <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-md rounded-full border border-white/60 shadow-sm px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-violet-500/30 flex-shrink-0">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[10px] font-semibold text-violet-600 tracking-wider uppercase truncate">
                Sistema de monitorías
              </span>
              <span className="text-xs text-gray-500 truncate">
                Universidad de Medellín
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="px-5 py-1.5 text-sm font-medium text-gray-900 bg-white rounded-full border border-gray-100 shadow-sm">
              Mural
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            2026-1 activo
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pt-24 pb-12 text-center">
        <div className="flex items-center justify-center gap-1 mb-6">
          <Plus className="w-3 h-3 text-violet-600" />
          <span className="text-xs font-semibold text-violet-600 tracking-wider uppercase">
            Plataforma inteligente de monitorías
          </span>
        </div>

        <h1 className="text-7xl sm:text-8xl md:text-9xl font-black leading-none tracking-tight mb-8">
          <span className="text-gray-900">Monitor</span>
          <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent">
            IA
          </span>
        </h1>

        <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
          Participa, gestiona convocatorias y haz seguimiento al trabajo como
          monitor, todo desde un solo lugar.
        </p>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 pb-16">
        <div className="grid grid-cols-3 gap-8 text-center">
          <StatItem value={stats.convocatoriasActivas} label="Convocatorias activas" />
          <StatItem value={stats.estudiantesPostulados} label="Estudiantes postulados" />
          <StatItem value={stats.monitoresAsignados} label="Monitores asignados" />
        </div>
      </section>

      {/* Selecciona tu rol */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pb-20">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Selecciona tu rol para continuar
          </h2>
          <p className="text-sm text-gray-500">
            Accede con tu cuenta institucional según tu posición en la universidad
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RolCard
            icon={<GraduationCap className="w-5 h-5 text-violet-400" />}
            label="DOCENTE"
            titulo="Gestiona tus convocatorias"
            desc="Crea convocatorias, define un periodo, selección, aprobación y haz seguimiento al trabajo de tus monitores asignados."
            onClick={() => router.push("/login/docente")}
          />
          <RolCard
            icon={<BookOpen className="w-5 h-5 text-violet-400" />}
            label="ESTUDIANTE"
            titulo="Postúlate como monitor"
            desc="Consulta las convocatorias activas en tu programa, compara tu afinidad con cada curso y conoce el resultado de tu postulación."
            onClick={() => router.push("/login/estudiante")}
          />
          <RolCard
            icon={<Users className="w-5 h-5 text-violet-400" />}
            label="MONITOR"
            titulo="Gestiona tu monitoría"
            desc="Registra las sesiones impartidas, sube evidencias de los temas vistos y cumple tu plan de trabajo de tu asignatura."
            onClick={() => router.push("/login/monitor")}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center pb-8">
        <p className="text-xs text-gray-400">
          Universidad de Medellín · Sistema de Monitorías · 2026-1
        </p>
      </footer>
    </div>
  );
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p
        className={`text-5xl font-black mb-2 ${
          value === 0 ? "text-gray-300" : "text-blue-600"
        }`}
      >
        {value}
      </p>
      <p className="text-xs font-medium text-gray-500 tracking-widest uppercase">
        {label}
      </p>
    </div>
  );
}

function RolCard({
  icon,
  label,
  titulo,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  titulo: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-gray-900 hover:bg-gray-800 rounded-2xl p-6 text-left transition-colors group relative overflow-hidden"
    >
      <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
        {label}
      </span>
      <h3 className="text-xl font-bold text-white mt-1 mb-3">{titulo}</h3>
      <p className="text-sm text-gray-400 leading-relaxed mb-5">{desc}</p>
      <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-400 group-hover:gap-2 transition-all">
        Ingresar
        <ArrowRight className="w-4 h-4" />
      </span>
    </button>
  );
}