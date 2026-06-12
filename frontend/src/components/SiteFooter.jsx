import React from "react";
import { Leaf } from "lucide-react";

/**
 * Rodapé — área logada (completo) ou páginas públicas (compact).
 */
export default function SiteFooter({ compact = false, className = "" }) {
  const year = new Date().getFullYear();

  if (compact) {
    return (
      <footer
        className={[
          "border-t border-emerald-200/50 bg-white/40 py-6 text-center backdrop-blur-sm",
          className,
        ].join(" ")}
      >
        <p className="font-display text-sm font-semibold text-slate-800">Nutri semana</p>
        <p className="mt-1 text-xs font-medium text-slate-500">
          TCC · Sistemas de Informação · demonstração educacional · {year}
        </p>
      </footer>
    );
  }

  return (
    <footer
      className={[
        "mt-12 border-t border-emerald-200/60 bg-gradient-to-r from-white/60 via-emerald-50/30 to-amber-50/20 py-8 backdrop-blur-sm",
        className,
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-glow">
            <Leaf size={18} aria-hidden />
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-slate-900">Nutri semana</p>
            <p className="text-xs font-medium text-slate-600">
              Planejamento alimentar personalizado · demonstração acadêmica (TCC)
            </p>
          </div>
        </div>
        <div className="text-xs font-medium text-slate-500 sm:text-right">
          <p>IA simulada · algoritmo genético · explicabilidade</p>
          <p className="mt-1 opacity-80">© {year} — Uso educacional</p>
        </div>
      </div>
    </footer>
  );
}
