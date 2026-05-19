"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const rolLabel =
    session?.user?.rol === "DOCENTE"
      ? "Sección Docente"
      : session?.user?.rol === "ESTUDIANTE"
      ? "Sección Estudiante"
      : "Sección Monitor";

  const isDashboardActive = pathname?.startsWith("/docente") || pathname?.startsWith("/estudiante") || pathname?.startsWith("/monitor");

  const inicials = session?.user
    ? `${session.user.nombre?.[0] || ""}${session.user.apellido?.[0] || ""}`.toUpperCase()
    : "?";

  return (
    <header className="sticky top-4 z-40 mx-4 sm:mx-8">
      <div className="max-w-7xl mx-auto bg-white/85 backdrop-blur-md rounded-full border border-white/60 shadow-sm px-5 py-2.5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-violet-500/30 group-hover:shadow-violet-500/50 transition">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-bold text-gray-900">
            Monitor<span className="text-violet-600">IA</span>
          </span>
        </Link>

        {/* Pestañas centrales */}
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={cn(
              "px-5 py-1.5 text-sm rounded-full transition",
              !isDashboardActive
                ? "font-medium text-gray-900 bg-white border border-gray-100 shadow-sm"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            Mural
          </Link>
          <button
            className={cn(
              "px-5 py-1.5 text-sm rounded-full transition",
              isDashboardActive
                ? "font-medium text-gray-900 bg-white border border-gray-100 shadow-sm"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            {rolLabel}
          </button>
        </nav>

        {/* Usuario + logout */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              {session?.user?.rol?.toLowerCase()}
            </p>
            <p className="text-xs font-medium text-gray-900 leading-tight">
              {session?.user?.nombre} {session?.user?.apellido?.[0]}.
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-violet-500/30">
            {inicials}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}