import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, CheckCircle2, Flame, Salad, ShoppingBasket, UtensilsCrossed } from "lucide-react";
import Card from "../components/Card.jsx";
import ResponsiveGrid from "../components/ResponsiveGrid.jsx";
import Button from "../components/Button.jsx";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../state/auth.jsx";

function scoreNutricional(targets, today) {
  if (!targets || !today) return 0;
  const cal = Math.abs(today.caloriesKcal - targets.caloriesKcal) / Math.max(1, targets.caloriesKcal);
  const p = Math.abs(today.proteinG - targets.proteinG) / Math.max(1, targets.proteinG);
  const c = Math.abs(today.carbsG - targets.carbsG) / Math.max(1, targets.carbsG);
  const f = Math.abs(today.fatG - targets.fatG) / Math.max(1, targets.fatG);
  const err = (cal * 1.2 + p + c + f) / 4.2;
  return Math.max(0, Math.min(100, Math.round((1 - err) * 100)));
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatShortDate(d) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit" }).format(d);
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [plan, setPlan] = useState(null);
  const [shopping, setShopping] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiFetch("/api/diet", { token });
        if (!alive) return;
        setPlan(data.plan);

        try {
          const shop = await apiFetch("/api/shopping-list", { token });
          if (!alive) return;
          setShopping(shop.shoppingList);
        } catch {
          // ok sem lista
          setShopping(null);
        }
      } catch (e) {
        if (!alive) return;
        setError(e.message || "Sem plano ainda.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const day1 = useMemo(() => (plan?.days?.length ? plan.days[0] : null), [plan]);

  const today = useMemo(() => {
    if (!plan?.days?.length) return null;
    const day = plan.days[0];
    const sums = day.meals.reduce(
      (acc, m) => {
        acc.caloriesKcal += Number(m.caloriesKcal || 0);
        acc.proteinG += Number(m.proteinG || 0);
        acc.carbsG += Number(m.carbsG || 0);
        acc.fatG += Number(m.fatG || 0);
        return acc;
      },
      { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    );
    return {
      caloriesKcal: Math.round(sums.caloriesKcal),
      proteinG: Math.round(sums.proteinG),
      carbsG: Math.round(sums.carbsG),
      fatG: Math.round(sums.fatG),
    };
  }, [plan]);

  const score = useMemo(() => scoreNutricional(plan?.targets, today), [plan, today]);
  const aderencia = useMemo(() => (score >= 80 ? "Alta" : score >= 60 ? "Média" : "Baixa"), [score]);

  const nextMeal = useMemo(() => {
    if (!day1?.meals?.length) return null;
    const order = { breakfast: 1, lunch: 2, snack: 3, dinner: 4 };
    const meals = [...day1.meals].sort((a, b) => (order[a.mealType] || 99) - (order[b.mealType] || 99));
    // Mostra a próxima refeição pendente; se todas concluídas, não há próxima.
    const pending = meals.find((m) => !m.completed);
    return pending || null;
  }, [day1]);

  const week = useMemo(() => {
    if (!plan?.weekStart) return null;
    const ws = startOfDay(plan.weekStart);
    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(ws);
      dt.setDate(ws.getDate() + i);
      const day = plan.days?.find((x) => x.dayIndex === i);
      const completed = day?.meals?.length ? day.meals.every((m) => m.completed) : false;
      return { dayIndex: i, date: dt, completed };
    });
  }, [plan]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="bg-gradient-to-r from-emerald-700 via-teal-700 to-lime-700 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            Seu painel nutritivo
          </h2>
          <p className="text-sm font-medium text-slate-700">
            Energia do dia, macros, aderência e seu calendário de vitórinhas na cozinha.
          </p>
        </div>
        <Button variant="brand" onClick={() => window.location.assign("/app/plano")}>
          <Salad size={18} />
          Abrir cardápio
        </Button>
      </div>

      {loading ? (
        <Card>Carregando...</Card>
      ) : error ? (
        <Card className="space-y-3">
          <p className="font-semibold text-slate-900">Você ainda não gerou um plano.</p>
          <p className="text-sm text-slate-600">
            Vá em <span className="font-semibold">Plano alimentar</span> e clique em “Gerar plano”.
          </p>
          <Button variant="brand" onClick={() => window.location.assign("/app/plano")}>
            Ir para gerar plano
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_420px] 2xl:grid-cols-[1fr_480px]">
          <div className="space-y-4">
            <ResponsiveGrid className="lg:grid-cols-4">
              <Card className="flex min-h-[160px] flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Consumo (dia 1)</p>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-citrus">
                    <Flame size={18} />
                  </span>
                </div>
                <div>
                  <p className="text-3xl font-extrabold tracking-tight">{today?.caloriesKcal || 0} kcal</p>
                  <p className="text-sm text-slate-600">
                    Meta: <span className="font-semibold">{plan.targets.caloriesKcal} kcal</span>
                  </p>
                </div>
              </Card>

              <Card className="flex min-h-[160px] flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Score nutricional</p>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-glow">
                    <BarChart3 size={18} />
                  </span>
                </div>
                <div>
                  <p className="text-3xl font-extrabold tracking-tight">{score}/100</p>
                  <p className="text-sm text-slate-600">Calorias + macros.</p>
                </div>
              </Card>

              <Card className="flex min-h-[160px] flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Aderência</p>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-600 text-white shadow-glow">
                    <CheckCircle2 size={18} />
                  </span>
                </div>
                <div>
                  <p className="text-3xl font-extrabold tracking-tight">{aderencia}</p>
                  <p className="text-sm text-slate-600">Proximidade da meta.</p>
                </div>
              </Card>

              <Card className="flex min-h-[160px] flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Custo semanal</p>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-citrus">
                    <ShoppingBasket size={18} />
                  </span>
                </div>
                <div>
                  <p className="text-3xl font-extrabold tracking-tight">
                    R$ {Number(plan?.estWeeklyCost || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-600">Estimativa do plano.</p>
                </div>
              </Card>
            </ResponsiveGrid>

            {plan ? (
              <Card className="space-y-3">
                <p className="text-sm font-extrabold text-slate-900">Macros diários (meta)</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <div className="rounded-2xl bg-rose-50 p-3 ring-2 ring-rose-100">
                    <p className="text-xs font-extrabold text-rose-800">Proteína</p>
                    <p className="text-lg font-extrabold text-slate-900">{plan.targets.proteinG} g</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-3 ring-2 ring-amber-100">
                    <p className="text-xs font-extrabold text-amber-900">Carboidrato</p>
                    <p className="text-lg font-extrabold text-slate-900">{plan.targets.carbsG} g</p>
                  </div>
                  <div className="rounded-2xl bg-sky-50 p-3 ring-2 ring-sky-100">
                    <p className="text-xs font-extrabold text-sky-900">Gordura</p>
                    <p className="text-lg font-extrabold text-slate-900">{plan.targets.fatG} g</p>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-lime-50 p-3 ring-2 ring-lime-200 lg:col-span-3">
                    <p className="text-xs font-extrabold text-emerald-900">Dica gostosa</p>
                    <p className="text-sm font-bold text-slate-900">
                      Ajustou meta ou orçamento? Atualize o Perfil e gere um plano novinho.
                    </p>
                  </div>
                </div>
              </Card>
            ) : null}

            {week ? (
              <Card className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-extrabold text-slate-900">Calendário (semana do plano)</p>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md">
                    <CalendarDays size={18} />
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {week.map((d) => (
                    <div
                      key={d.dayIndex}
                      className={[
                        "rounded-2xl p-2 text-center ring-1",
                        d.completed ? "bg-emerald-600 text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200",
                      ].join(" ")}
                    >
                      <p className="text-[11px] font-extrabold uppercase">{formatShortDate(d.date)}</p>
                      <p className="mt-1 text-xs font-semibold">{d.completed ? "OK" : "—"}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-600">
                  Marque as refeições como concluídas no Plano alimentar. Quando todas do dia estiverem OK, o dia fica verde aqui.
                </p>
              </Card>
            ) : null}
          </div>

          <div className="space-y-4">
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-extrabold text-slate-900">Resumo do dia</p>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-glow">
                  <UtensilsCrossed size={18} />
                </span>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-white to-amber-50/60 p-4 ring-2 ring-amber-100">
                <p className="text-xs font-extrabold text-amber-900/80">Próxima refeição</p>
                <p className="mt-1 text-base font-extrabold text-slate-900">{nextMeal?.name || "—"}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {nextMeal
                    ? `${Math.round(nextMeal.caloriesKcal)} kcal • P ${Math.round(nextMeal.proteinG)}g`
                    : day1?.meals?.length
                      ? "Parabéns! Todas as refeições do dia estão concluídas."
                      : "Gere um plano para ver detalhes."}
                </p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-lime-50 p-4 ring-2 ring-emerald-200">
                <p className="text-xs font-extrabold text-emerald-900">Lista de compras (preview)</p>
                {shopping?.items?.length ? (
                  <>
                    <p className="mt-1 text-sm text-slate-700">
                      {shopping.items.slice(0, 6).map((it) => it.name).join(", ")}
                      {shopping.items.length > 6 ? "…" : ""}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      Custo estimado: R$ {Number(shopping.estCost || 0).toFixed(2)}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-slate-700">Gere um plano para montar sua lista.</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <Button variant="brand" className="w-full" onClick={() => window.location.assign("/app/plano")}>
                  <Salad size={18} />
                  Ver meu plano
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => window.location.assign("/app/compras")}>
                  <ShoppingBasket size={18} />
                  Ver compras
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

