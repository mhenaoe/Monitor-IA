import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // ── Producción: Microsoft Office 365 (RNF-02) ──
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
    }),

    // ── Desarrollo: Login con credenciales para testing ──
    Credentials({
      name: "Desarrollo",
      credentials: {
        correo: { label: "Correo", type: "email" },
      },
      async authorize(credentials) {
        if (process.env.NODE_ENV !== "development") return null;

        const correo = credentials?.correo as string;
        if (!correo) return null;

        const usuario = await db.usuario.findUnique({
          where: { correo },
          include: { estudiante: true, docente: true },
        });

        if (!usuario) return null;

        return {
          id: usuario.id,
          email: usuario.correo,
          name: `${usuario.nombre} ${usuario.apellido}`,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // Para OAuth (Microsoft): verificar que el usuario existe en nuestra DB
      if (account?.provider === "microsoft-entra-id") {
        const usuario = await db.usuario.findUnique({
          where: { correo: user.email! },
        });
        if (!usuario || !usuario.activo) return false;
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        const usuario = await db.usuario.findUnique({
          where: { correo: user.email! },
          include: { estudiante: true, docente: true },
        });

        if (usuario) {
          token.id = usuario.id;
          token.rol = usuario.rol;
          token.nombre = usuario.nombre;
          token.apellido = usuario.apellido;

          if (usuario.estudiante) {
            token.estudianteId = usuario.estudiante.id;
            token.programa = usuario.estudiante.programa;
          }
          if (usuario.docente) {
            token.docenteId = usuario.docente.id;
            token.departamento = usuario.docente.departamento;
          }
        }
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.rol = token.rol as string;
      session.user.nombre = token.nombre as string;
      session.user.apellido = token.apellido as string;
      session.user.estudianteId = token.estudianteId as string | undefined;
      session.user.docenteId = token.docenteId as string | undefined;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
  },

  trustHost: true,
});