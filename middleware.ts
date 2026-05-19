import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isAuthRoute = nextUrl.pathname.startsWith("/login");
  const isDashboardRoute =
    nextUrl.pathname.startsWith("/docente") ||
    nextUrl.pathname.startsWith("/estudiante") ||
    nextUrl.pathname.startsWith("/monitor");
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

  if (isApiAuth) return NextResponse.next();

  if (isLoggedIn && isAuthRoute) {
    const rol = req.auth?.user?.rol;
    if (rol === "DOCENTE") {
      return NextResponse.redirect(new URL("/docente/convocatorias", nextUrl));
    }
    if (rol === "ESTUDIANTE") {
      return NextResponse.redirect(new URL("/estudiante/mural", nextUrl));
    }
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (!isLoggedIn && isDashboardRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
