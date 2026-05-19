import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/20 to-purple-50/30">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-10">
        <div className="flex gap-6">
          <Sidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}