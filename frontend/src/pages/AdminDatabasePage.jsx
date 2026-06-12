import React, { useEffect, useState } from "react";
import { Database, RefreshCw } from "lucide-react";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../state/auth.jsx";

function JsonBlock({ title, data, count }) {
  return (
    <details className="rounded-xl border border-emerald-100 bg-white/90 ring-1 ring-emerald-50">
      <summary className="cursor-pointer px-3 py-2 text-sm font-extrabold text-emerald-900 [&::-webkit-details-marker]:hidden">
        {title}
        {typeof count === "number" ? (
          <span className="ml-2 text-xs font-semibold text-slate-500">({count} reg.)</span>
        ) : null}
      </summary>
      <pre className="max-h-[min(85vh,1200px)] overflow-auto border-t border-emerald-100/80 p-3 text-[11px] leading-relaxed text-slate-800">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

export default function AdminDatabasePage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/database-inspect", { token });
      setData(res);
    } catch (e) {
      setData(null);
      setError(e.message || "Falha ao inspecionar o banco.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const countEntries = data?.counts ? Object.entries(data.counts) : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="bg-gradient-to-r from-teal-700 to-emerald-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            Admin • Banco de dados
          </h2>
          <p className="text-sm font-medium text-slate-700">
            Visualização somente leitura do SQLite — todos os registros por tabela. Uso educacional (TCC).
          </p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw size={18} />
          Atualizar
        </Button>
      </div>

      {error ? <Card className="text-sm text-rose-700">{error}</Card> : null}

      {loading ? (
        <Card>Carregando...</Card>
      ) : data ? (
        <>
          <Card className="space-y-2 bg-white/80 backdrop-blur">
            <div className="flex items-center gap-2">
              <Database size={20} className="text-emerald-700" />
              <p className="text-sm font-extrabold text-emerald-900">Conexão</p>
            </div>
            <p className="text-sm text-slate-700">
              <span className="font-bold">Motor:</span> {data.meta?.engine || "—"}
              {data.meta?.sqliteFile ? (
                <>
                  {" "}
                  · <span className="font-bold">Arquivo:</span> {data.meta.sqliteFile}
                </>
              ) : null}
            </p>
            <p className="text-xs font-medium text-slate-600">{data.meta?.note}</p>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-emerald-100 bg-emerald-50/70 px-4 py-3">
              <p className="text-sm font-extrabold text-emerald-900">Registros por tabela</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-sm">
                <thead className="bg-white text-xs font-extrabold text-emerald-900">
                  <tr>
                    <th className="px-4 py-2">Tabela (modelo)</th>
                    <th className="px-4 py-2 text-right">Quantidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100/80">
                  {countEntries.map(([name, n]) => (
                    <tr key={name} className="bg-white/95">
                      <td className="px-4 py-2 font-semibold text-slate-800">{name}</td>
                      <td className="px-4 py-2 text-right font-extrabold text-slate-900">{n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="space-y-3">
            <p className="text-sm font-extrabold text-slate-900">Dados completos (JSON)</p>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <JsonBlock title="User" data={data.tables?.users} count={data.counts?.User} />
              <JsonBlock title="Food" data={data.tables?.foods} count={data.counts?.Food} />
              <JsonBlock title="Meal" data={data.tables?.meals} count={data.counts?.Meal} />
              <JsonBlock title="DietPlan" data={data.tables?.dietPlans} count={data.counts?.DietPlan} />
              <JsonBlock title="DietMeal" data={data.tables?.dietMeals} count={data.counts?.DietMeal} />
              <JsonBlock title="MealCompletion" data={data.tables?.mealCompletions} count={data.counts?.MealCompletion} />
              <JsonBlock title="ShoppingList" data={data.tables?.shoppingLists} count={data.counts?.ShoppingList} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
