import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Apple,
  Carrot,
  Check,
  ChefHat,
  Coffee,
  FileDown,
  ForkKnife,
  PartyPopper,
  RefreshCw,
  Utensils,
  X,
} from "lucide-react";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import ResponsiveGrid from "../components/ResponsiveGrid.jsx";
import { apiFetch } from "../lib/api.js";
import { downloadDayPlanPdf } from "../lib/dayPlanPdf.js";
import { useAuth } from "../state/auth.jsx";

const dayNames = ["Dia 1", "Dia 2", "Dia 3", "Dia 4", "Dia 5", "Dia 6", "Dia 7"];
const mealOrder = { breakfast: 1, lunch: 2, snack: 3, dinner: 4 };
const mealLabel = {
  breakfast: "Café da manhã",
  lunch: "Almoço",
  dinner: "Jantar",
  snack: "Lanche",
};

const mealIcon = {
  breakfast: Coffee,
  lunch: Utensils,
  dinner: ForkKnife,
  snack: Apple,
};

function Chip({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-lime-50 text-lime-900 ring-lime-200",
    emerald: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    sky: "bg-sky-50 text-sky-800 ring-sky-200",
    amber: "bg-amber-50 text-amber-900 ring-amber-200",
  };
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold",
        "ring-1",
        tones[tone] || tones.slate,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function DayTabs({ active, onChange }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex w-max gap-2 pb-1 sm:w-full sm:flex-wrap">
        {dayNames.map((label, idx) => {
          const isActive = idx === active;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onChange(idx)}
              className={[
                "whitespace-nowrap rounded-full px-3 py-2 text-sm font-extrabold",
                "ring-1 transition",
                isActive
                  ? "bg-gradient-to-r from-emerald-500 to-lime-500 text-white shadow-glow ring-0"
                  : "bg-white/90 text-slate-800 ring-2 ring-amber-100 hover:bg-amber-50/80",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MealCard({ meal, token, onToggleCompleted }) {
  const [sub, setSub] = useState(null);
  const [subLoadingId, setSubLoadingId] = useState("");
  const [items, setItems] = useState(meal.items || []);

  useEffect(() => {
    setItems(meal.items || []);
  }, [meal]);

  async function loadSubs(foodId) {
    setSubLoadingId(foodId);
    try {
      const data = await apiFetch("/api/substitute", { token, body: { foodId } });
      setSub({ foodId, base: data.base, substitutes: data.substitutes });
    } finally {
      setSubLoadingId("");
    }
  }

  function applySubstitute(oldFoodId, newFood) {
    // Substituição no frontend (demo). Não persiste no banco para manter o TCC simples.
    const nextItems = (items || []).map((it) =>
      it.foodId === oldFoodId
        ? {
            ...it,
            foodId: newFood.id,
            name: newFood.name,
            // Mantém qty/unit (equivalência simplificada)
            caloriesKcal: Math.round(newFood.caloriesKcal),
            proteinG: Number(newFood.proteinG.toFixed(1)),
            carbsG: Number(newFood.carbsG.toFixed(1)),
            fatG: Number(newFood.fatG.toFixed(1)),
          }
        : it,
    );
    setItems(nextItems);
    setSub(null);
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-glow">
            {React.createElement(mealIcon[meal.mealType] || ChefHat, { size: 18 })}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold text-slate-900">
              {mealLabel[meal.mealType] || meal.name}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Chip tone="emerald">{Math.round(meal.caloriesKcal)} kcal</Chip>
              <Chip tone="sky">P {Math.round(meal.proteinG)}g</Chip>
              <Chip tone="amber">C {Math.round(meal.carbsG)}g</Chip>
              <Chip tone="slate">G {Math.round(meal.fatG)}g</Chip>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggleCompleted(meal.dietMealId)}
          className={[
            "shrink-0 rounded-full px-3 py-2 text-sm font-extrabold ring-1 transition",
            meal.completed
              ? "bg-emerald-600 text-white ring-emerald-600 hover:bg-emerald-500"
              : "bg-white text-slate-900 ring-slate-200 hover:bg-slate-50",
          ].join(" ")}
          aria-label={meal.completed ? "Desmarcar refeição" : "Marcar refeição como concluída"}
        >
          <span className="inline-flex items-center gap-2">
            <Check size={18} />
            {meal.completed ? "Concluída" : "Concluir"}
          </span>
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-extrabold text-slate-800">Ingredientes</p>
        <ul className="space-y-2 text-sm text-slate-700">
          {(items || []).map((it) => (
            <li
              key={it.foodId}
              className="flex items-start justify-between gap-3 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-white p-3 ring-2 ring-emerald-100/80"
            >
              <div className="min-w-0">
                <p className="truncate font-extrabold text-slate-900">{it.name}</p>
                <button
                  type="button"
                  className="mt-1 text-xs font-extrabold text-emerald-700 underline-offset-2 hover:underline"
                  onClick={() => loadSubs(it.foodId)}
                  disabled={subLoadingId === it.foodId}
                >
                  {subLoadingId === it.foodId ? "Buscando equivalentes..." : "Substituir"}
                </button>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-extrabold text-slate-900">
                  {it.qty}
                  {it.unit}
                </p>
                <p className="text-xs text-slate-500">porção</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {sub ? (
        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-slate-800">
            Equivalentes para: <span className="font-extrabold">{sub.base?.name}</span>
          </p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(sub.substitutes || []).map((f) => (
              <button
                key={f.id}
                type="button"
                className="rounded-xl bg-white p-3 text-left ring-1 ring-slate-200 transition hover:bg-slate-100"
                onClick={() => applySubstitute(sub.foodId, f)}
              >
                <p className="font-extrabold text-slate-900">{f.name}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Chip tone="emerald">{Math.round(f.caloriesKcal)} kcal</Chip>
                  <Chip tone="sky">P {Math.round(f.proteinG)}g</Chip>
                  <Chip tone="amber">C {Math.round(f.carbsG)}g</Chip>
                  <Chip tone="slate">G {Math.round(f.fatG)}g</Chip>
                </div>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-2 text-xs font-semibold text-slate-600 hover:underline"
            onClick={() => setSub(null)}
          >
            Fechar
          </button>
        </div>
      ) : null}

      {meal.recipeIdeas?.length ? (
        <details className="rounded-2xl bg-gradient-to-br from-amber-50/90 via-white to-lime-50/70 p-3 ring-2 ring-amber-100/90 open:shadow-sm">
          <summary className="cursor-pointer list-none text-sm font-extrabold text-emerald-900 [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <ChefHat size={16} className="text-emerald-700" aria-hidden />
              Sugestões de receita com estes alimentos
            </span>
          </summary>
          <div className="mt-3 space-y-4">
            {meal.recipeIdeas.map((r, idx) => (
              <div
                key={`${r.title}-${idx}`}
                className="rounded-2xl bg-white/95 p-3 ring-1 ring-emerald-100/80"
              >
                <p className="text-sm font-extrabold text-slate-900">{r.title}</p>
                <p className="mt-1 text-xs font-bold text-teal-700">~{r.prepMinutes} min (estimado)</p>
                {r.summary ? <p className="mt-1 text-sm font-medium text-slate-700">{r.summary}</p> : null}
                <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
                  {(r.steps || []).map((s, i) => (
                    <li key={i} className="leading-snug">
                      {s}
                    </li>
                  ))}
                </ol>
                {r.disclaimer ? <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{r.disclaimer}</p> : null}
              </div>
            ))}
          </div>
        </details>
      ) : null}

      <details className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
        <summary className="cursor-pointer text-sm font-extrabold text-slate-900">
          Por que essa refeição foi recomendada?
        </summary>
        <p className="mt-2 text-sm text-slate-700">{meal.explanation}</p>
      </details>
    </Card>
  );
}

export default function PlanoPage() {
  const { token, user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const congratsKeyRef = useRef("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/diet", { token });
      setPlan(data.plan);
    } catch (e) {
      setPlan(null);
      setError(e.message || "Sem plano.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function onGenerate() {
    setGenerating(true);
    setError("");
    try {
      await apiFetch("/api/generate-diet", { token, body: {} });
      await load();
    } catch (e) {
      setError(e.message || "Falha ao gerar.");
    } finally {
      setGenerating(false);
    }
  }

  const days = useMemo(() => {
    if (!plan?.days) return [];
    return plan.days.map((d) => ({
      ...d,
      meals: [...(d.meals || [])].sort((a, b) => (mealOrder[a.mealType] || 99) - (mealOrder[b.mealType] || 99)),
    }));
  }, [plan]);

  const active = days[activeDay] || null;
  const activeCalories = useMemo(() => {
    if (!active) return 0;
    return active.meals.reduce((acc, m) => acc + Number(m.caloriesKcal || 0), 0);
  }, [active]);

  const dayCompleted = useMemo(() => {
    if (!active?.meals?.length) return false;
    return active.meals.every((m) => Boolean(m.completed));
  }, [active]);

  useEffect(() => {
    if (!plan?.id || active == null) return;
    const key = `tcce_day_ok:${plan.id}:${active.dayIndex}`;
    congratsKeyRef.current = key;
    if (dayCompleted) {
      const seen = localStorage.getItem(key) === "1";
      if (!seen) {
        localStorage.setItem(key, "1");
        setShowCongrats(true);
      }
    }
  }, [dayCompleted, plan?.id, active?.dayIndex]);

  async function onExportDayPdf() {
    if (!plan || !active?.meals?.length) return;
    setPdfError("");
    setPdfExporting(true);
    try {
      await downloadDayPlanPdf({ plan, day: active, user });
    } catch (e) {
      setPdfError(e?.message || "Não foi possível gerar o PDF.");
    } finally {
      setPdfExporting(false);
    }
  }

  async function toggleMealCompleted(dietMealId) {
    if (!dietMealId) return;
    // otimista
    setPlan((p) => {
      if (!p) return p;
      const next = structuredClone(p);
      for (const d of next.days || []) {
        for (const m of d.meals || []) {
          if (m.dietMealId === dietMealId) m.completed = !m.completed;
        }
      }
      return next;
    });

    try {
      const res = await apiFetch(`/api/diet-meals/${dietMealId}/toggle-complete`, { token, body: {} });
      setPlan((p) => {
        if (!p) return p;
        const next = structuredClone(p);
        for (const d of next.days || []) {
          for (const m of d.meals || []) {
            if (m.dietMealId === dietMealId) m.completed = Boolean(res.completed);
          }
        }
        return next;
      });
    } catch (e) {
      // rollback com recarregamento (mais simples e consistente)
      setError(e.message || "Falha ao atualizar progresso.");
      await load();
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-white/80 backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-100 to-lime-100 px-3 py-1.5 text-sm font-extrabold text-emerald-900 ring-2 ring-emerald-200/60">
              <ChefHat size={16} />
              Sua semana no prato
            </div>
            <p className="mt-2 text-sm font-medium text-slate-700">
              Misturamos ciência (TMB, macros, algoritmo genético) com aquele calor de “vamos comer bem”. Navegue pelos dias nas abas.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="brand" onClick={onGenerate} disabled={generating} className="w-full sm:w-auto">
              <Carrot size={18} />
              {generating ? "Montando delícias..." : "Gerar novo plano"}
            </Button>
            <Button variant="secondary" onClick={load} disabled={loading} className="w-full sm:w-auto">
              <RefreshCw size={18} />
              Atualizar
            </Button>
          </div>
        </div>
      </Card>

      {error ? <Card className="text-sm text-rose-700">{error}</Card> : null}

      {loading ? (
        <Card>Carregando...</Card>
      ) : !plan ? (
        <Card className="space-y-2">
          <p className="font-semibold text-slate-900">Nenhum plano encontrado.</p>
          <p className="text-sm text-slate-600">
            Clique em <span className="font-semibold">Gerar plano</span> para criar seu plano semanal.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-white/80 backdrop-blur">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
                <p className="text-xs font-extrabold text-emerald-800">Meta calórica</p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
                  {plan.targets.caloriesKcal} <span className="text-base text-slate-700">kcal/dia</span>
                </p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200">
                <p className="text-xs font-extrabold text-sky-900">Macros diários (P/C/G)</p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
                  {plan.targets.proteinG}g <span className="text-slate-400">/</span> {plan.targets.carbsG}g{" "}
                  <span className="text-slate-400">/</span> {plan.targets.fatG}g
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
                <p className="text-xs font-extrabold text-amber-900">Custo semanal estimado</p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
                  R$ {Number(plan.estWeeklyCost).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <DayTabs active={activeDay} onChange={setActiveDay} />
            </div>
          </Card>

          {active ? (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight text-slate-900">
                    {dayNames[active.dayIndex] || `Dia ${active.dayIndex + 1}`}
                  </h3>
                  <p className="text-sm text-slate-600">Refeições do dia com substituições e explicação.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:w-auto"
                    disabled={pdfExporting}
                    onClick={onExportDayPdf}
                  >
                    <FileDown size={18} />
                    {pdfExporting ? "Gerando PDF..." : "Exportar PDF do dia"}
                  </Button>
                  <Chip tone="emerald">{activeCalories.toFixed(0)} kcal no dia</Chip>
                </div>
              </div>
              {pdfError ? <p className="text-sm font-semibold text-rose-700">{pdfError}</p> : null}

              {dayCompleted ? (
                <Card className="bg-emerald-50 ring-emerald-200">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-extrabold text-emerald-900">Dia concluído!</p>
                      <p className="text-sm text-slate-700">
                        Você marcou todas as refeições do dia como realizadas. Excelente constância.
                      </p>
                    </div>
                    <Button variant="secondary" onClick={() => setShowCongrats(true)}>
                      <PartyPopper size={18} />
                      Ver parabéns
                    </Button>
                  </div>
                </Card>
              ) : null}

              <ResponsiveGrid className="lg:grid-cols-2 xl:grid-cols-3">
                {active.meals.map((m) => (
                  <MealCard key={m.id} meal={m} token={token} onToggleCompleted={toggleMealCompleted} />
                ))}
              </ResponsiveGrid>
            </div>
          ) : null}
        </div>
      )}

      {showCongrats ? (
        <div className="fixed inset-0 z-[60]">
          <button
            className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[2px]"
            onClick={() => setShowCongrats(false)}
            aria-label="Fechar parabéns"
          />
          <div className="absolute left-1/2 top-1/2 w-[92%] max-w-lg -translate-x-1/2 -translate-y-1/2">
            <Card className="bg-white/90">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="bg-gradient-to-r from-emerald-600 to-lime-600 bg-clip-text text-sm font-extrabold text-transparent">
                    Parabéns, chef de si mesmo!
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    Você cruzou a linha de chegada do dia alimentar. Celebre — consistência também é sabor.
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setShowCongrats(false)}>
                  <X size={18} />
                  Fechar
                </Button>
              </div>

              <div className="mt-4 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-lime-500 p-4 text-white shadow-glow ring-2 ring-white/30">
                <p className="text-sm font-extrabold">Status do dia</p>
                <p className="mt-1 text-2xl font-extrabold text-white">Tudo certo — mandou bem!</p>
                <p className="mt-1 text-sm font-medium text-emerald-50">
                  Amanhã é só ajustar preferências no Perfil e seguir firme na nutrição com leveza.
                </p>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}

