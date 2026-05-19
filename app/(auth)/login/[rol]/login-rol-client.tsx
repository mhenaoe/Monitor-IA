"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  ArrowLeft,
  LogIn,
  AlertCircle,
  BookOpen,
  Users,
} from "lucide-react";

interface LoginRolClientProps {
  rol: "docente" | "estudiante" | "monitor";
}

const rolConfig = {
  docente: {
    titulo: "Docente",
    desc: "Ingresa para gestionar tus convocatorias y seleccionar monitores",
    icon: GraduationCap,
    correoDemo: "docente@udem.edu.co",
  },
  estudiante: {
    titulo: "Estudiante",
    desc: "Ingresa para consultar convocatorias y postularte como monitor",
    icon: BookOpen,
    correoDemo: "estudiante@udem.edu.co",
  },
  monitor: {
    titulo: "Monitor",
    desc: "Ingresa para gestionar tu monitoría y registrar tu trabajo",
    icon: Users,
    correoDemo: "estudiante@udem.edu.co", // monitor usa cuenta estudiante
  },
};

export function LoginRolClient({ rol }: LoginRolClientProps) {
  const config = rolConfig[rol];
  const Icon = config.icon;

  const [correo, setCorreo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("microsoft-entra-id", { callbackUrl: "/" });
    } catch {
      setError("Error al conectar con Office 365. Intenta de nuevo.");
      setIsLoading(false);
    }
  };

  const handleDevLogin = async (correoParam: string) => {
    setIsLoading(true);
    setError(null);
    const result = await signIn("credentials", {
      correo: correoParam,
      redirect: false,
    });

    if (result?.error || !result?.ok) {
      setError("Usuario no encontrado. Verifica el correo o ejecuta el seed.");
      setIsLoading(false);
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/50 relative overflow-hidden p-4">
      {/* Decorative */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-200 rounded-full opacity-30 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-30 blur-3xl" />

      {/* Back button */}
      <Link
        href="/login"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Link>

      <div className="relative w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/60 p-8">
          {/* Icon + titulo */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <span className="text-[10px] font-semibold text-violet-600 tracking-widest uppercase mb-1">
              Acceso como
            </span>
            <h1 className="text-2xl font-bold text-gray-900">
              {config.titulo}
            </h1>
            <p className="text-sm text-gray-500 text-center mt-2 leading-relaxed">
              {config.desc}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 mb-5 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Botón Office 365 */}
          <button
            onClick={handleMicrosoftLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-md shadow-violet-500/30 hover:shadow-lg hover:shadow-violet-500/40 transition-all disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {isLoading ? "Conectando..." : "Ingresar con cuenta institucional"}
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            Usa tu correo <span className="font-mono">@udem.edu.co</span>
          </p>

          {/* Modo dev */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-7 pt-5 border-t border-dashed border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider">
                  🔧 Dev
                </span>
                <span className="text-xs text-gray-500">
                  Login rápido sin Office 365
                </span>
              </div>

              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder={config.correoDemo}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 mb-2"
              />

              <button
                onClick={() => handleDevLogin(correo || config.correoDemo)}
                disabled={isLoading}
                className="w-full px-4 py-2 text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition disabled:opacity-50"
              >
                Ingresar en modo desarrollo
              </button>

              <button
                onClick={() => handleDevLogin(config.correoDemo)}
                disabled={isLoading}
                className="w-full px-4 py-2 text-xs text-gray-500 hover:text-gray-700 mt-2 transition disabled:opacity-50"
              >
                Usar cuenta de prueba:{" "}
                <span className="font-mono font-medium">
                  {config.correoDemo}
                </span>
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-5">
          Universidad de Medellín · Sistema de Monitorías · 2026-1
        </p>
      </div>
    </div>
  );
}