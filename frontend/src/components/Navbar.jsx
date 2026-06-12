import React from "react";
import { Menu, Salad } from "lucide-react";
import Button from "./Button.jsx";

export default function Navbar({ onOpenMenu }) {
  return (
    <div className="sticky top-0 z-40 border-b-2 border-emerald-200/50 bg-gradient-to-r from-emerald-50/95 via-white/90 to-amber-50/85 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-6 xl:px-6 2xl:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400 text-white shadow-glow ring-2 ring-white/80">
            <Salad size={20} className="shrink-0 drop-shadow-sm" aria-hidden />
          </div>
          <div className="leading-tight">
            <p className="font-display bg-gradient-to-r from-emerald-700 via-teal-700 to-lime-700 bg-clip-text text-base font-bold tracking-tight text-transparent sm:text-lg">
              Nutri semana
            </p>
            <p className="text-xs font-semibold text-teal-800/90">
              Planejamento gostoso, saudável e no seu bolso — projeto TCC (IA simulada)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="lg:hidden"
            onClick={onOpenMenu}
            aria-label="Abrir menu"
          >
            <Menu size={18} />
            Menu
          </Button>
        </div>
      </div>
    </div>
  );
}

