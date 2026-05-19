import { LoginRolClient } from "./login-rol-client";
import { notFound } from "next/navigation";

const rolesValidos = ["docente", "estudiante", "monitor"] as const;
type RolParam = (typeof rolesValidos)[number];

export default async function LoginRolPage({
  params,
}: {
  params: Promise<{ rol: string }>;
}) {
  const { rol } = await params;

  if (!rolesValidos.includes(rol as RolParam)) {
    notFound();
  }

  return <LoginRolClient rol={rol as RolParam} />;
}