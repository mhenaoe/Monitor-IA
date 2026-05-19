import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  if (!session) redirect("/login");

  switch (session.user.rol) {
    case "DOCENTE":
      redirect("/docente/convocatorias");
    case "ESTUDIANTE":
      redirect("/estudiante/mural");
    case "MONITOR":
      redirect("/estudiante/mural");
    default:
      redirect("/login");
  }
}
