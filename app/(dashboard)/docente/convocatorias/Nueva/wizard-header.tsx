import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Props {
  currentStep: 1 | 2;
}

const pasos = [
  { num: 1, label: "Datos básicos", desc: "Curso, fechas y preguntas" },
  { num: 2, label: "Criterios", desc: "Requisitos de validación" },
];

export function WizardHeader({ currentStep }: Props) {
  return (
    <div className="flex items-center gap-2 py-4 border-y border-gray-100">
      {pasos.map((paso, idx) => {
        const isActive = currentStep === paso.num;
        const isDone = currentStep > paso.num;
        const isLast = idx === pasos.length - 1;

        return (
          <div key={paso.num} className="flex items-center gap-2 flex-1">
            {/* Circle */}
            <div
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                isActive &&
                  "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/30",
                isDone && "bg-violet-100 text-violet-700",
                !isActive && !isDone && "bg-gray-100 text-gray-400"
              )}
            >
              {isDone ? <Check className="w-4 h-4" /> : paso.num}
            </div>

            {/* Label */}
            <div className="min-w-0">
              <div
                className={cn(
                  "text-sm font-semibold leading-tight",
                  isActive && "text-gray-900",
                  isDone && "text-violet-700",
                  !isActive && !isDone && "text-gray-400"
                )}
              >
                {paso.label}
              </div>
              <div className="text-[11px] text-gray-400 leading-tight mt-0.5 hidden sm:block">
                {paso.desc}
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  "flex-1 h-px mx-2 transition-colors",
                  isDone ? "bg-violet-300" : "bg-gray-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}