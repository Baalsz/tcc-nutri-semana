import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Apple, Carrot, CheckCircle2, LockKeyhole, Mail, Timer } from "lucide-react";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import Container from "../components/Container.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../state/auth.jsx";
import { ErrorText, Helper, Input, Label, Select, Textarea } from "../components/FormField.jsx";

export default function RegisterPage() {
  const nav = useNavigate();
  const { setSession } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openLgpdLaw() {
    // Lei 13.709/2018 (LGPD) - página oficial no Planalto
    const url = "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm";
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    consentLgpd: false,
    sex: "other",
    age: 22,
    weightKg: 70,
    heightCm: 170,
    goal: "maintain",
    activityLevel: "moderate",
    targetWeightKg: "",
    weeklyWeightKg: "0.5",
    goalNotes: "",
    restrictions: "",
    preferences: "",
    budgetPerWeek: 150,
    prepTimeMinutes: 30,
  });

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!form.consentLgpd) {
        throw new Error("Consentimento LGPD é obrigatório.");
      }
      const payload = {
        ...form,
        age: Number.parseInt(String(form.age), 10),
        weightKg: Number.parseFloat(String(form.weightKg)),
        heightCm: Number.parseFloat(String(form.heightCm)),
        budgetPerWeek: Number.parseFloat(String(form.budgetPerWeek)),
        prepTimeMinutes: Number.parseInt(String(form.prepTimeMinutes), 10),
        activityLevel: form.activityLevel || "moderate",
        targetWeightKg:
          String(form.targetWeightKg).trim() === "" ? null : Number.parseFloat(String(form.targetWeightKg)),
        weeklyWeightKg:
          form.goal === "maintain" || String(form.weeklyWeightKg).trim() === ""
            ? null
            : Number.parseFloat(String(form.weeklyWeightKg)),
        goalNotes: String(form.goalNotes || "").trim().slice(0, 400),
      };
      const data = await apiFetch("/api/register", { body: payload });
      setSession(data);
      nav("/app/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Falha no cadastro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-gradient-to-br from-lime-50/80 via-white to-orange-50/70">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-400/40 blur-3xl" />
        <div className="absolute -right-16 top-8 h-80 w-80 rounded-full bg-amber-400/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-teal-300/30 blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-64 w-64 rounded-full bg-orange-300/25 blur-3xl" />
      </div>

      <Container className="relative z-10 flex w-full flex-1 flex-col py-10 sm:py-12">
        <div className="flex flex-1 flex-col">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
          <div className="order-2 lg:order-1">
            <div className="mb-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm font-extrabold text-teal-900 shadow-sm ring-2 ring-emerald-200/80 backdrop-blur">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-lime-400 text-white shadow-sm">
                  <Apple size={16} />
                </span>
                Vamos personalizar sua nutrição
              </div>
              <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl sm:leading-tight animate-fade-up">
                Seu plano da semana
                <span className="bg-gradient-to-r from-emerald-600 via-lime-600 to-teal-600 bg-clip-text text-transparent">
                  {" "}
                  em poucos passos
                </span>
              </h1>
              <p className="mt-3 max-w-prose text-base font-medium text-slate-700">
                Conte um pouco sobre você — calculamos TMB, macros e já geramos refeições, explicações e lista
                de compras com tudo que combina com você.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Card className="bg-white/70 backdrop-blur">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
                    <Carrot size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">Plano completo</p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      7 dias, refeições separadas e macros por refeição.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/70 backdrop-blur">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-teal-500 text-white shadow-md">
                    <Timer size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">Tempo de preparo</p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      Ajuste para uma rotina real (acadêmico, mas útil).
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/70 backdrop-blur sm:col-span-2">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-slate-900">
                    <CheckCircle2 size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">Explicabilidade + substituições</p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      Veja por que foi recomendado e troque por equivalentes.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="mx-auto w-full max-w-2xl">
              <div className="mb-5">
                <Card className="bg-white/80 backdrop-blur">
                  <p className="text-sm font-extrabold text-emerald-800">Vamos criar sua conta</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    Seus dados alimentam o algoritmo do TCC — só para recomendações e métricas.
                  </p>
                </Card>
              </div>

              <Card className="bg-white/80 backdrop-blur">
                <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Seu nome"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      placeholder="voce@exemplo.com"
                      required
                      className="pl-10"
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <LockKeyhole
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setField("password", e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      className="pl-10"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="sex">Sexo (para TMB)</Label>
                  <Select id="sex" value={form.sex} onChange={(e) => setField("sex", e.target.value)}>
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                    <option value="other">Outro/Prefiro não dizer</option>
                  </Select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="goal">Objetivo principal</Label>
                  <Select
                    id="goal"
                    value={form.goal}
                    onChange={(e) => setField("goal", e.target.value)}
                  >
                    <option value="lose">Perder peso</option>
                    <option value="maintain">Manter peso</option>
                    <option value="gain">Ganhar massa</option>
                  </Select>
                  <Helper>
                    Com <span className="font-semibold">peso alvo</span> e{" "}
                    <span className="font-semibold">ritmo semanal</span> estimamos suas calorias com mais precisão (TCC).
                  </Helper>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="activityLevel">Nível de atividade (para calcular gasto energético)</Label>
                  <Select
                    id="activityLevel"
                    value={form.activityLevel}
                    onChange={(e) => setField("activityLevel", e.target.value)}
                  >
                    <option value="sedentary">Sedentário (pouco ou nenhum exercício)</option>
                    <option value="light">Leve (exercício leve 1–3x/semana)</option>
                    <option value="moderate">Moderado (moderado 3–5x/semana)</option>
                    <option value="active">Ativo (pesado 6–7x/semana)</option>
                    <option value="very_active">Muito ativo (muito intenso / trabalho físico)</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="targetWeightKg">Peso alvo (kg, opcional)</Label>
                  <Input
                    id="targetWeightKg"
                    type="number"
                    inputMode="decimal"
                    value={form.targetWeightKg}
                    onChange={(e) => setField("targetWeightKg", e.target.value)}
                    placeholder="Ex: 68"
                    min={35}
                    max={250}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="weeklyWeightKg">
                    Ritmo (kg/semana) {form.goal === "maintain" ? "" : "— perder ou ganhar"}
                  </Label>
                  <Input
                    id="weeklyWeightKg"
                    type="number"
                    inputMode="decimal"
                    value={form.weeklyWeightKg}
                    onChange={(e) => setField("weeklyWeightKg", e.target.value)}
                    placeholder="Ex: 0,5"
                    min={0.05}
                    max={1.5}
                    step="0.05"
                    disabled={form.goal === "maintain"}
                  />
                  <Helper>
                    {form.goal === "maintain"
                      ? "Em “manter”, usamos seu gasto estimado sem déficit ou superávit forçado."
                      : "Usamos ~7700 kcal/kg/semana como aproximação acadêmica para ajustar kcal/dia."}
                  </Helper>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="goalNotes">Outras metas ou observações (opcional)</Label>
                  <Textarea
                    id="goalNotes"
                    value={form.goalNotes}
                    onChange={(e) => setField("goalNotes", e.target.value)}
                    placeholder="Ex: correr 5 km até fim do semestre; reduzir ultraprocessados"
                    maxLength={400}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="age">Idade</Label>
                  <Input
                    id="age"
                    type="number"
                    inputMode="numeric"
                    value={form.age}
                    onChange={(e) => setField("age", e.target.value)}
                    min={10}
                    max={120}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="weightKg">Peso (kg)</Label>
                  <Input
                    id="weightKg"
                    type="number"
                    inputMode="decimal"
                    value={form.weightKg}
                    onChange={(e) => setField("weightKg", e.target.value)}
                    min={20}
                    max={400}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="heightCm">Altura (cm)</Label>
                  <Input
                    id="heightCm"
                    type="number"
                    inputMode="numeric"
                    value={form.heightCm}
                    onChange={(e) => setField("heightCm", e.target.value)}
                    min={80}
                    max={250}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prepTimeMinutes">Tempo de preparo (min)</Label>
                  <Input
                    id="prepTimeMinutes"
                    type="number"
                    inputMode="numeric"
                    value={form.prepTimeMinutes}
                    onChange={(e) => setField("prepTimeMinutes", e.target.value)}
                    min={5}
                    max={240}
                    required
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="budgetPerWeek">Orçamento semanal (R$)</Label>
                  <Input
                    id="budgetPerWeek"
                    type="number"
                    inputMode="decimal"
                    value={form.budgetPerWeek}
                    onChange={(e) => setField("budgetPerWeek", e.target.value)}
                    min={0}
                    required
                  />
                  <Helper>Usamos o orçamento na função fitness do algoritmo genético (penalidade).</Helper>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="restrictions">Restrições alimentares (CSV)</Label>
                  <Textarea
                    id="restrictions"
                    value={form.restrictions}
                    onChange={(e) => setField("restrictions", e.target.value)}
                    placeholder="Ex: lactose, gluten, vegan"
                  />
                  <Helper>
                    Dica: usamos tags como <span className="font-semibold">contains_gluten</span> e{" "}
                    <span className="font-semibold">contains_lactose</span>.
                  </Helper>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="preferences">Preferências (CSV)</Label>
                  <Textarea
                    id="preferences"
                    value={form.preferences}
                    onChange={(e) => setField("preferences", e.target.value)}
                    placeholder="Ex: frango, arroz, banana"
                  />
                  <Helper>Preferências dão um pequeno “boost” na seleção dos alimentos.</Helper>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-emerald-50/80 p-3 ring-2 ring-emerald-100">
                <input
                  id="consentLgpd"
                  type="checkbox"
                  checked={form.consentLgpd}
                  onChange={(e) => setField("consentLgpd", e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <Label htmlFor="consentLgpd">Consentimento LGPD (simulado)</Label>
                  <Helper>
                    Você autoriza o uso dos dados para gerar recomendações e estatísticas no dashboard.
                  </Helper>
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9"
                      onClick={openLgpdLaw}
                    >
                      Leia sobre
                    </Button>
                  </div>
                </div>
              </div>

              <ErrorText>{error}</ErrorText>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="brand" type="submit" className="w-full sm:w-auto" disabled={loading}>
                  {loading ? "Criando..." : "Começar agora"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => nav("/login")}
                >
                  Já tenho conta
                </Button>
              </div>

              <p className="text-center text-sm text-slate-600">
                Ao continuar, você concorda com o uso acadêmico dos dados para o TCC.
              </p>
            </form>
              </Card>

              <p className="mt-4 text-center text-sm text-slate-600">
                Já tem conta?{" "}
                <Link to="/login" className="font-extrabold text-emerald-700 hover:text-emerald-800 hover:underline">
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        </div>
        </div>
      </Container>
      <SiteFooter compact className="relative z-10 mt-auto shrink-0" />
    </div>
  );
}

