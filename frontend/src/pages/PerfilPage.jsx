import React, { useEffect, useMemo, useState } from "react";
import { Check, Clock, HandCoins, Info, Mail, Pencil, Ruler, Salad, Scale, Shield, User2, X } from "lucide-react";
import { apiFetch } from "../lib/api.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import { Helper, Input, Select, Textarea } from "../components/FormField.jsx";
import { useAuth } from "../state/auth.jsx";

function parseCsvList(csv) {
  return String(csv || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function activityLabel(v) {
  const m = {
    sedentary: "Sedentário",
    light: "Leve",
    moderate: "Moderado",
    active: "Ativo",
    very_active: "Muito ativo",
  };
  return m[v] || v || "—";
}

export default function PerfilPage() {
  const { token, user } = useAuth();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBmi, setShowBmi] = useState(false);
  const [nutritionPreview, setNutritionPreview] = useState(null);
  const [draft, setDraft] = useState({
    sex: "other",
    age: 18,
    weightKg: 70,
    heightCm: 170,
    goal: "maintain",
    activityLevel: "moderate",
    targetWeightKg: "",
    weeklyWeightKg: "",
    goalNotes: "",
    budgetPerWeek: 150,
    prepTimeMinutes: 30,
    restrictions: "",
    preferences: "",
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch("/api/me", { token });
        if (!alive) return;
        setMe(data.user);
        setNutritionPreview(data.nutritionPreview || null);
        setDraft({
          sex: data.user?.sex || "other",
          age: data.user?.age ?? 18,
          weightKg: data.user?.weightKg ?? 70,
          heightCm: data.user?.heightCm ?? 170,
          goal: data.user?.goal || "maintain",
          activityLevel: data.user?.activityLevel || "moderate",
          targetWeightKg: data.user?.targetWeightKg != null ? String(data.user.targetWeightKg) : "",
          weeklyWeightKg: data.user?.weeklyWeightKg != null ? String(data.user.weeklyWeightKg) : "",
          goalNotes: data.user?.goalNotes || "",
          budgetPerWeek: data.user?.budgetPerWeek ?? 150,
          prepTimeMinutes: data.user?.prepTimeMinutes ?? 30,
          restrictions: data.user?.restrictions || "",
          preferences: data.user?.preferences || "",
        });
      } catch (e) {
        if (!alive) return;
        setError(e.message || "Falha ao carregar perfil.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const initial = useMemo(() => {
    const n = me?.name || user?.name || "";
    return n.trim().slice(0, 1).toUpperCase() || "U";
  }, [me?.name, user?.name]);

  const roleLabel = me?.role === "ADMIN" ? "Admin" : "Usuário";

  const goalLabel = useMemo(() => {
    if (!me?.goal) return "-";
    if (me.goal === "lose") return "Perder peso";
    if (me.goal === "gain") return "Ganhar massa";
    return "Manter peso";
  }, [me?.goal]);

  const weightGoalHint = useMemo(() => {
    if (me?.targetWeightKg == null || me?.weightKg == null) return null;
    const tgt = Number(me.targetWeightKg);
    const cur = Number(me.weightKg);
    const diff = tgt - cur;
    if (me.goal === "lose" && diff < 0) return `Reduzir ~${Math.abs(diff).toFixed(1)} kg até ${tgt} kg.`;
    if (me.goal === "gain" && diff > 0) return `Ganhar ~${diff.toFixed(1)} kg até ${tgt} kg.`;
    if (me.goal === "maintain") return `Peso de referência: ${tgt} kg (comparado a ${cur.toFixed(1)} kg hoje).`;
    if (Math.abs(diff) < 0.1) return "Peso atual já próximo da meta informada.";
    return `Diferença até a meta: ${diff > 0 ? "+" : ""}${diff.toFixed(1)} kg.`;
  }, [me?.goal, me?.targetWeightKg, me?.weightKg]);

  const bmi = useMemo(() => {
    if (!me?.weightKg || !me?.heightCm) return null;
    const h = Number(me.heightCm) / 100;
    if (!h) return null;
    return Number(me.weightKg) / (h * h);
  }, [me?.weightKg, me?.heightCm]);

  const bmiInfo = useMemo(() => {
    if (!bmi) return null;
    if (bmi < 18.5) return { label: "Abaixo do peso", tone: "sky", range: "< 18,5" };
    if (bmi < 25) return { label: "Peso normal", tone: "emerald", range: "18,5 – 24,9" };
    if (bmi < 30) return { label: "Sobrepeso", tone: "amber", range: "25,0 – 29,9" };
    if (bmi < 35) return { label: "Obesidade I", tone: "rose", range: "30,0 – 34,9" };
    if (bmi < 40) return { label: "Obesidade II", tone: "rose", range: "35,0 – 39,9" };
    return { label: "Obesidade III", tone: "rose", range: "≥ 40,0" };
  }, [bmi]);

  const bmiToneClass = (tone) => {
    if (tone === "emerald") return "bg-emerald-50 text-emerald-900 ring-emerald-200";
    if (tone === "sky") return "bg-sky-50 text-sky-900 ring-sky-200";
    if (tone === "amber") return "bg-amber-50 text-amber-900 ring-amber-200";
    if (tone === "rose") return "bg-rose-50 text-rose-900 ring-rose-200";
    return "bg-slate-100 text-slate-900 ring-slate-200";
  };

  async function onSaveProfile() {
    setSaving(true);
    setError("");
    try {
      const data = await apiFetch("/api/me", {
        token,
        method: "PATCH",
        body: {
          sex: draft.sex,
          age: draft.age,
          weightKg: draft.weightKg,
          heightCm: draft.heightCm,
          goal: draft.goal,
          activityLevel: draft.activityLevel,
          targetWeightKg: String(draft.targetWeightKg).trim() === "" ? null : Number.parseFloat(String(draft.targetWeightKg)),
          weeklyWeightKg:
            draft.goal === "maintain" || String(draft.weeklyWeightKg).trim() === ""
              ? null
              : Number.parseFloat(String(draft.weeklyWeightKg)),
          goalNotes: String(draft.goalNotes || "").trim().slice(0, 400),
          restrictions: draft.restrictions,
          preferences: draft.preferences,
          budgetPerWeek: draft.budgetPerWeek,
          prepTimeMinutes: draft.prepTimeMinutes,
        },
      });
      setMe(data.user);
      setNutritionPreview(data.nutritionPreview || null);
      setEditing(false);
    } catch (e) {
      setError(e.message || "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="bg-gradient-to-r from-emerald-700 via-teal-700 to-amber-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            Meu perfil saudável
          </h2>
          <p className="text-sm font-medium text-slate-700">
            Quanto mais a gente te conhece, mais gostoso e certeiro fica o plano.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {!editing ? (
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => setEditing(true)}
            >
              <Pencil size={18} />
              Editar perfil
            </Button>
          ) : (
            <>
              <Button variant="brand" className="w-full sm:w-auto" onClick={onSaveProfile} disabled={saving}>
                <Check size={18} />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => {
                  setEditing(false);
                  setDraft({
                    sex: me?.sex || "other",
                    age: me?.age ?? 18,
                    weightKg: me?.weightKg ?? 70,
                    heightCm: me?.heightCm ?? 170,
                    goal: me?.goal || "maintain",
                    activityLevel: me?.activityLevel || "moderate",
                    targetWeightKg: me?.targetWeightKg != null ? String(me.targetWeightKg) : "",
                    weeklyWeightKg: me?.weeklyWeightKg != null ? String(me.weeklyWeightKg) : "",
                    goalNotes: me?.goalNotes || "",
                    budgetPerWeek: me?.budgetPerWeek ?? 150,
                    prepTimeMinutes: me?.prepTimeMinutes ?? 30,
                    restrictions: me?.restrictions || "",
                    preferences: me?.preferences || "",
                  });
                }}
                disabled={saving}
              >
                <X size={18} />
                Cancelar
              </Button>
            </>
          )}

          <Button variant="accent" className="w-full sm:w-auto" onClick={() => window.location.assign("/app/plano")}>
            <Salad size={18} />
            Ver cardápio da semana
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>Carregando...</Card>
      ) : error ? (
        <Card className="text-sm text-rose-700">{error}</Card>
      ) : (
        <>
          <Card className="relative overflow-hidden bg-white/80 backdrop-blur">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-lime-300/45 blur-3xl" />
              <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-amber-200/45 blur-3xl" />
            </div>

            <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr] sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 via-lime-400 to-amber-400 text-slate-900 shadow-glow ring-2 ring-white">
                  <span className="text-2xl font-extrabold">{initial}</span>
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700">Olá,</p>
                  <p className="truncate text-2xl font-extrabold text-slate-900">{me?.name || "-"}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200">
                      <Mail size={14} />
                      {me?.email || "-"}
                    </span>
                    <span
                      className={[
                        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold ring-1",
                        me?.role === "ADMIN"
                          ? "bg-amber-50 text-amber-900 ring-amber-200"
                          : "bg-emerald-50 text-emerald-800 ring-emerald-200",
                      ].join(" ")}
                    >
                      <Shield size={14} />
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-extrabold text-slate-500">Consentimento LGPD</p>
                  <p className="mt-1 text-base font-extrabold text-slate-900">
                    {me?.consentLgpd ? "Autorizado" : "Não autorizado"}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Usado para simular o uso de dados na recomendação.
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-extrabold text-slate-500">IMC rápido</p>
                  <p className="mt-1 text-xs text-slate-600">Objetivo e metas nutricionais estão no card abaixo.</p>
                  {bmi ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">IMC:</span>
                      <span className="text-xs font-extrabold text-slate-900">{bmi.toFixed(1)}</span>
                      {bmiInfo ? (
                        <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-extrabold ring-1 ${bmiToneClass(bmiInfo.tone)}`}>
                          {bmiInfo.label}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setShowBmi(true)}
                        className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-2 py-1 text-[11px] font-extrabold text-white shadow-sm ring-2 ring-white/40 hover:brightness-110"
                      >
                        <Info size={14} />
                        Tabela IMC
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-slate-600">IMC não calculado</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="space-y-4 border-2 border-emerald-100/90 bg-gradient-to-br from-white via-emerald-50/30 to-amber-50/20">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-extrabold text-emerald-900">Objetivo &amp; metas nutricionais</p>
                <p className="text-xs font-medium text-slate-700">
                  TMB, TDEE (gasto estimado) e calorias-alvo para o gerador de plano.
                </p>
              </div>
              <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold text-emerald-900 ring-1 ring-emerald-200">
                {goalLabel}
              </span>
            </div>

            {nutritionPreview ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-2xl bg-white/90 p-3 ring-1 ring-emerald-100">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">TMB</p>
                  <p className="text-lg font-extrabold text-slate-900">{nutritionPreview.bmr}</p>
                  <p className="text-[10px] text-slate-500">kcal/dia</p>
                </div>
                <div className="rounded-2xl bg-white/90 p-3 ring-1 ring-teal-100">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">TDEE</p>
                  <p className="text-lg font-extrabold text-slate-900">{nutritionPreview.tdee}</p>
                  <p className="text-[10px] text-slate-500">gasto est.</p>
                </div>
                <div className="rounded-2xl bg-white/90 p-3 ring-1 ring-lime-100 sm:col-span-2 lg:col-span-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Meta calórica (plano)</p>
                  <p className="text-lg font-extrabold text-emerald-800">{nutritionPreview.estimatedDailyCalories} kcal/dia</p>
                  <p className="text-[10px] text-slate-600">
                    P ≈ {nutritionPreview.estimatedProteinG} g · C ≈ {nutritionPreview.estimatedCarbsG} g · G ≈{" "}
                    {nutritionPreview.estimatedFatG} g
                  </p>
                </div>
                <div className="rounded-2xl bg-white/90 p-3 ring-1 ring-amber-100 col-span-2 sm:col-span-1 lg:col-span-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Fator ativ.</p>
                  <p className="text-lg font-extrabold text-slate-900">{nutritionPreview.activityFactor}</p>
                  <p className="text-[10px] text-slate-500">{activityLabel(me?.activityLevel)}</p>
                </div>
              </div>
            ) : null}

            {!editing ? (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-extrabold text-slate-800">Atividade:</span>{" "}
                  <span className="font-medium text-slate-700">{activityLabel(me?.activityLevel)}</span>
                </p>
                {me?.targetWeightKg != null ? (
                  <p>
                    <span className="font-extrabold text-slate-800">Peso alvo:</span>{" "}
                    <span className="font-medium text-slate-700">{me.targetWeightKg} kg</span>
                  </p>
                ) : (
                  <p className="text-slate-600">Peso alvo não informado.</p>
                )}
                {me?.goal !== "maintain" && me?.weeklyWeightKg != null ? (
                  <p>
                    <span className="font-extrabold text-slate-800">Ritmo:</span>{" "}
                    <span className="font-medium text-slate-700">{me.weeklyWeightKg} kg/semana</span>
                  </p>
                ) : me?.goal === "maintain" ? (
                  <p className="text-slate-600">Manutenção: sem déficit/superávit forçado pelo ritmo semanal.</p>
                ) : (
                  <p className="text-slate-600">Ritmo semanal não informado — usamos ajuste padrão do sistema.</p>
                )}
                {weightGoalHint ? <p className="rounded-xl bg-white/80 p-2 text-xs font-medium text-teal-900 ring-1 ring-teal-100">{weightGoalHint}</p> : null}
                {me?.goalNotes?.trim() ? (
                  <div className="rounded-xl bg-amber-50/80 p-3 ring-1 ring-amber-100">
                    <p className="text-xs font-extrabold text-amber-900">Outras metas</p>
                    <p className="mt-1 text-sm font-medium text-slate-800 whitespace-pre-wrap">{me.goalNotes.trim()}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-xs font-extrabold text-emerald-900">Objetivo</p>
                  <Select value={draft.goal} onChange={(e) => setDraft((d) => ({ ...d, goal: e.target.value }))}>
                    <option value="lose">Perder peso</option>
                    <option value="maintain">Manter peso</option>
                    <option value="gain">Ganhar massa</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-extrabold text-emerald-900">Nível de atividade</p>
                  <Select
                    value={draft.activityLevel}
                    onChange={(e) => setDraft((d) => ({ ...d, activityLevel: e.target.value }))}
                  >
                    <option value="sedentary">Sedentário</option>
                    <option value="light">Leve</option>
                    <option value="moderate">Moderado</option>
                    <option value="active">Ativo</option>
                    <option value="very_active">Muito ativo</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-extrabold text-emerald-900">Peso alvo (kg)</p>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={draft.targetWeightKg}
                    onChange={(e) => setDraft((d) => ({ ...d, targetWeightKg: e.target.value }))}
                    placeholder="Opcional"
                    min={35}
                    max={250}
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-extrabold text-emerald-900">Ritmo (kg/semana)</p>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={draft.weeklyWeightKg}
                    onChange={(e) => setDraft((d) => ({ ...d, weeklyWeightKg: e.target.value }))}
                    placeholder="Ex: 0,5"
                    disabled={draft.goal === "maintain"}
                    min={0.05}
                    max={1.5}
                    step="0.05"
                  />
                  <Helper>{draft.goal === "maintain" ? "Desabilitado em manutenção." : "Ajusta kcal/dia (~7700 kcal/kg)."}</Helper>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <p className="text-xs font-extrabold text-emerald-900">Outras metas (texto livre)</p>
                  <Textarea
                    value={draft.goalNotes}
                    onChange={(e) => setDraft((d) => ({ ...d, goalNotes: e.target.value }))}
                    placeholder="Metas de comportamento, performance, etc."
                    maxLength={400}
                  />
                </div>
              </div>
            )}
          </Card>

          {showBmi ? (
            <div className="fixed inset-0 z-[60]">
              <button
                className="absolute inset-0 bg-emerald-950/35 backdrop-blur-[2px]"
                onClick={() => setShowBmi(false)}
                aria-label="Fechar tabela IMC"
              />
              <div className="absolute left-1/2 top-1/2 w-[92%] max-w-lg -translate-x-1/2 -translate-y-1/2">
                <Card className="bg-white/90">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">Tabela de IMC</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Classificação (adultos) baseada em faixas de IMC.
                      </p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setShowBmi(false)}>
                      <X size={18} />
                      Fechar
                    </Button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {[
                      { range: "< 18,5", label: "Abaixo do peso", tone: "sky" },
                      { range: "18,5 – 24,9", label: "Peso normal", tone: "emerald" },
                      { range: "25,0 – 29,9", label: "Sobrepeso", tone: "amber" },
                      { range: "30,0 – 34,9", label: "Obesidade I", tone: "rose" },
                      { range: "35,0 – 39,9", label: "Obesidade II", tone: "rose" },
                      { range: "≥ 40,0", label: "Obesidade III", tone: "rose" },
                    ].map((row) => {
                      const isActive = bmiInfo?.range === row.range;
                      return (
                        <div
                          key={row.range}
                          className={[
                            "flex items-center justify-between gap-3 rounded-2xl p-3 ring-1",
                            isActive ? "bg-emerald-50 ring-emerald-200" : "bg-slate-50 ring-slate-200",
                          ].join(" ")}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold text-slate-900">{row.label}</p>
                            <p className="text-xs text-slate-600">IMC {row.range}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-extrabold ring-1 ${bmiToneClass(row.tone)}`}>
                            {row.range}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-lime-500 p-4 text-white shadow-glow ring-2 ring-white/25">
                    <p className="text-sm font-extrabold">Seu IMC</p>
                    <p className="mt-1 text-2xl font-extrabold">{bmi ? bmi.toFixed(1) : "—"}</p>
                    <p className="mt-1 text-sm font-medium text-emerald-50">
                      Categoria: {bmiInfo?.label || "—"}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="space-y-3">
              <p className="text-sm font-extrabold text-slate-900">Dados pessoais</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <div className="flex items-center gap-2">
                    <User2 size={16} className="text-slate-700" />
                    <p className="text-xs font-extrabold text-slate-500">Idade</p>
                  </div>
                  {editing ? (
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={draft.age}
                        onChange={(e) => setDraft((d) => ({ ...d, age: e.target.value }))}
                      />
                      <Select
                        value={draft.sex}
                        onChange={(e) => setDraft((d) => ({ ...d, sex: e.target.value }))}
                      >
                        <option value="male">Masculino</option>
                        <option value="female">Feminino</option>
                        <option value="other">Outro</option>
                      </Select>
                    </div>
                  ) : (
                    <>
                      <p className="mt-1 text-lg font-extrabold text-slate-900">{me?.age ?? "-"}</p>
                      <p className="text-xs text-slate-600">{me?.sex ? `Sexo: ${me.sex}` : ""}</p>
                    </>
                  )}
                </div>

                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <div className="flex items-center gap-2">
                    <Scale size={16} className="text-slate-700" />
                    <p className="text-xs font-extrabold text-slate-500">Peso</p>
                  </div>
                  {editing ? (
                    <div className="mt-2">
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={draft.weightKg}
                        onChange={(e) => setDraft((d) => ({ ...d, weightKg: e.target.value }))}
                      />
                      <Helper>kg</Helper>
                    </div>
                  ) : (
                    <>
                      <p className="mt-1 text-lg font-extrabold text-slate-900">{me?.weightKg ?? "-"} kg</p>
                      <p className="text-xs text-slate-600">Base para TMB</p>
                    </>
                  )}
                </div>

                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <div className="flex items-center gap-2">
                    <Ruler size={16} className="text-slate-700" />
                    <p className="text-xs font-extrabold text-slate-500">Altura</p>
                  </div>
                  {editing ? (
                    <div className="mt-2">
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={draft.heightCm}
                        onChange={(e) => setDraft((d) => ({ ...d, heightCm: e.target.value }))}
                      />
                      <Helper>cm</Helper>
                    </div>
                  ) : (
                    <>
                      <p className="mt-1 text-lg font-extrabold text-slate-900">{me?.heightCm ?? "-"} cm</p>
                      <p className="text-xs text-slate-600">Base para TMB</p>
                    </>
                  )}
                </div>
              </div>
            </Card>

            <Card className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-extrabold text-slate-900">Preferências & rotina</p>
                <span className="text-xs font-semibold text-slate-500">
                  {editing ? "Modo edição" : "Visualização"}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <div className="flex items-center gap-2">
                    <HandCoins size={16} className="text-slate-700" />
                    <p className="text-xs font-extrabold text-slate-500">Orçamento</p>
                  </div>
                  {editing ? (
                    <div className="mt-2">
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={draft.budgetPerWeek}
                        onChange={(e) => setDraft((d) => ({ ...d, budgetPerWeek: e.target.value }))}
                      />
                      <Helper>R$ por semana</Helper>
                    </div>
                  ) : (
                    <>
                      <p className="mt-1 text-lg font-extrabold text-slate-900">R$ {me?.budgetPerWeek ?? "-"}</p>
                      <p className="text-xs text-slate-600">Penalidade no fitness</p>
                    </>
                  )}
                </div>

                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-700" />
                    <p className="text-xs font-extrabold text-slate-500">Tempo</p>
                  </div>
                  {editing ? (
                    <div className="mt-2">
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={draft.prepTimeMinutes}
                        onChange={(e) => setDraft((d) => ({ ...d, prepTimeMinutes: e.target.value }))}
                      />
                      <Helper>minutos</Helper>
                    </div>
                  ) : (
                    <>
                      <p className="mt-1 text-lg font-extrabold text-slate-900">{me?.prepTimeMinutes ?? "-"} min</p>
                      <p className="text-xs text-slate-600">Uso no exemplo</p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-extrabold text-slate-800">Restrições alimentares</p>
                {editing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={draft.restrictions}
                      onChange={(e) => setDraft((d) => ({ ...d, restrictions: e.target.value }))}
                      placeholder="Ex: vegano, gluten, lactose"
                    />
                    <Helper>
                      Dica: use valores separados por vírgula. Exemplos: <span className="font-semibold">vegano</span>,{" "}
                      <span className="font-semibold">vegetariano</span>, <span className="font-semibold">gluten</span>,{" "}
                      <span className="font-semibold">lactose</span>.
                    </Helper>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {parseCsvList(me?.restrictions).length ? (
                      parseCsvList(me?.restrictions).map((t) => (
                        <span
                          key={t}
                          className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-extrabold text-rose-900 ring-1 ring-rose-200"
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-600">Nenhuma</span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-extrabold text-slate-800">Preferências</p>
                {editing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={draft.preferences}
                      onChange={(e) => setDraft((d) => ({ ...d, preferences: e.target.value }))}
                      placeholder="Ex: tofu, arroz, feijão, banana"
                    />
                    <Helper>Preferências dão um pequeno “boost” na seleção dos alimentos.</Helper>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {parseCsvList(me?.preferences).length ? (
                      parseCsvList(me?.preferences).map((t) => (
                        <span
                          key={t}
                          className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-900 ring-1 ring-emerald-200"
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-600">Nenhuma</span>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

