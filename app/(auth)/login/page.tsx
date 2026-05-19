import { LoginClient } from "./login-client";
import { obtenerStatsLanding } from "@/lib/actions/stats";

export default async function LoginPage() {
  // Server-side: consulta a la DB para obtener stats reales
  const stats = await obtenerStatsLanding();

  return <LoginClient stats={stats} />;
}