import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: string;
      nombre: string;
      apellido: string;
      estudianteId?: string;
      docenteId?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    rol?: string;
    nombre?: string;
    apellido?: string;
    estudianteId?: string;
    docenteId?: string;
    programa?: string;
    departamento?: string;
  }
}