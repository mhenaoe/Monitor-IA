import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "default"
    | "borrador"
    | "publicada"
    | "cerrada"
    | "aceptado"
    | "rechazada"
    | "info"
    | "warning";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full",
        {
          "bg-gray-100 text-gray-700": variant === "default",
          "bg-teal-50 text-teal-700": variant === "borrador",
          "bg-violet-50 text-violet-700": variant === "publicada",
          "bg-red-50 text-red-600": variant === "cerrada" || variant === "rechazada",
          "bg-emerald-50 text-emerald-700": variant === "aceptado",
          "bg-blue-50 text-blue-700": variant === "info",
          "bg-amber-50 text-amber-700": variant === "warning",
        },
        className
      )}
    >
      {children}
    </span>
  );
}