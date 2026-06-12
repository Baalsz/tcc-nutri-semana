import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Database, Users, UtensilsCrossed } from "lucide-react";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import ResponsiveGrid from "../components/ResponsiveGrid.jsx";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../state/auth.jsx";

function StatCard({ label, value, icon: Icon, tone = "slate" }) {
  const tones = {
    slate: "bg-white ring-slate-200",
    emerald: "bg-emerald-50 ring-emerald-200",
    sky: "bg-sky-50 ring-sky-200",
    amber: "bg-amber-50 ring-amber-200",
  };
  return (
    <div className={["rounded-2xl p-4 ring-1", tones[tone] || tones.slate].join(" ")}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-extrabold text-slate-700">{label}</p>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-glow">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const nav = useNavigate();
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/admin/stats", { token });
      setStats(data.stats);
    } catch (e) {
      setError(e.message || "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="bg-gradient-to-r from-teal-700 to-emerald-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            Admin • Painel
          </h2>
          <p className="text-sm font-medium text-slate-700">Visão geral do sistema (TCC).</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" variant="brand" className="w-full sm:w-auto" onClick={() => nav("/app/admin/banco")}>
            <Database size={18} />
            Abrir banco de dados
          </Button>
          <Button variant="secondary" className="w-full sm:w-auto" onClick={load} disabled={loading}>
            <BarChart3 size={18} />
            Atualizar
          </Button>
        </div>
      </div>

      {error ? <Card className="text-sm text-rose-700">{error}</Card> : null}
      {loading ? (
        <Card>Carregando...</Card>
      ) : (
        <Card className="bg-white/80 backdrop-blur">
          <ResponsiveGrid className="lg:grid-cols-3">
            <StatCard label="Usuários" value={stats?.users ?? 0} icon={Users} tone="emerald" />
            <StatCard label="Alimentos" value={stats?.foods ?? 0} icon={UtensilsCrossed} tone="sky" />
            <StatCard label="Planos gerados" value={stats?.dietPlans ?? 0} icon={Database} tone="amber" />
          </ResponsiveGrid>
          <p className="mt-4 text-sm text-slate-600">
            Dica: mantenha a base de alimentos bem variada para melhorar variedade e substituições do algoritmo.
          </p>
        </Card>
      )}
    </div>
  );
}

