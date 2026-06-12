import React from "react";
import { Link, NavLink } from "react-router-dom";
import { CalendarDays, ClipboardList, Database, LayoutDashboard, LogOut, Shield, User } from "lucide-react";
import Button from "./Button.jsx";

const nav = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/plano", label: "Plano alimentar", icon: CalendarDays },
  { to: "/app/compras", label: "Lista de compras", icon: ClipboardList },
  { to: "/app/perfil", label: "Perfil", icon: User },
];

const adminNav = [
  { to: "/app/admin/painel", label: "Admin • Painel", icon: Shield },
  { to: "/app/admin/usuarios", label: "Admin • Usuários", icon: Shield },
  { to: "/app/admin/alimentos", label: "Admin • Alimentos", icon: Shield },
  { to: "/app/admin/banco", label: "Admin • Banco de dados", icon: Database },
];

function Item({ to, label, icon: Icon, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold",
          "transition",
          isActive
            ? "bg-gradient-to-r from-emerald-500 to-lime-500 text-white shadow-glow ring-0"
            : "text-slate-800 hover:bg-amber-50/80 hover:ring-2 hover:ring-amber-200/60",
        ].join(" ")
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );
}

export default function Sidebar({ user, onLogout, onNavigate, compact = false }) {
  const isAdmin = user?.role === "ADMIN";
  return (
    <div className={compact ? "p-4" : "p-4 lg:p-6"}>
      <div className="mb-4 hidden lg:block">
        <Link to="/app/dashboard" className="text-sm font-extrabold text-emerald-900">
          Olá, {user?.name || "usuário"}!
        </Link>
        <p className="text-xs text-slate-500">{user?.email || ""}</p>
        {isAdmin ? (
          <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-extrabold text-emerald-900 ring-1 ring-emerald-200">
            ADMIN
          </span>
        ) : null}
      </div>

      <nav className="flex flex-col gap-2">
        {nav.map((it) => (
          <Item key={it.to} {...it} onNavigate={onNavigate} />
        ))}

        {isAdmin ? (
          <>
            <div className="my-2 h-px bg-slate-200/70" />
            {adminNav.map((it) => (
              <Item key={it.to} {...it} onNavigate={onNavigate} />
            ))}
          </>
        ) : null}
      </nav>

      <div className="mt-6">
        <Button variant="secondary" className="w-full" onClick={onLogout}>
          <LogOut size={18} />
          Sair
        </Button>
      </div>
    </div>
  );
}

