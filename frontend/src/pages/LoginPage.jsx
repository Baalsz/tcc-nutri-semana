import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Apple, BarChart3, Carrot, LockKeyhole, User } from "lucide-react";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import Container from "../components/Container.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { Input, Label, ErrorText } from "../components/FormField.jsx";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../state/auth.jsx";

export default function LoginPage() {
  const { setSession } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from || "/app/dashboard";

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/api/login", { body: { login, password } });
      setSession(data);
      nav(from, { replace: true });
    } catch (err) {
      setError(err.message || "Falha no login.");
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
        <div className="absolute right-1/4 top-1/2 h-64 w-64 rounded-full bg-orange-300/25 blur-3xl" />
      </div>

      <Container className="relative z-10 flex w-full flex-1 flex-col py-10 sm:py-12">
        <div className="flex min-h-0 flex-1 flex-col justify-center">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-10 lg:items-center">
          <div className="order-2 lg:order-1">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm font-extrabold text-teal-900 shadow-sm ring-2 ring-emerald-200/80 backdrop-blur">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-lime-400 text-white shadow-sm">
                  <Apple size={16} />
                </span>
                Comer bem pode ser simples (e colorido!)
              </div>

              <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl sm:leading-tight animate-fade-up">
                Seu cardápio da semana,
                <span className="bg-gradient-to-r from-emerald-600 via-lime-600 to-teal-600 bg-clip-text text-transparent">
                  {" "}
                  do seu jeito
                </span>
                .
              </h1>
              <p className="mt-3 max-w-prose text-base font-medium text-slate-700">
                Montamos um plano com calorias e macros, respeitando o que você gosta, o que não pode, seu
                orçamento e o tempo na cozinha — tudo com cara de nutrição de verdade.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Card className="bg-white/70 backdrop-blur">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
                    <Carrot size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">Plano semanal completo</p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      Café, almoço, jantar e lanches com ingredientes e macros.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/70 backdrop-blur">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
                    <BarChart3 size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">Explicável e rastreável</p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      Entenda “por que” cada refeição foi recomendada.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="mx-auto w-full max-w-md">
              <Card className="bg-white/80 backdrop-blur">
                <div className="mb-5">
                  <p className="text-sm font-extrabold text-emerald-800">Seja bem-vindo!</p>
                  <p className="mt-1.5 text-sm font-medium leading-relaxed text-teal-800/95">
                    Pequenos hábitos no prato hoje viram mais energia e equilíbrio amanhã — seu cuidado começa aqui.
                  </p>
                  <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">Entrar</h2>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    Usuário ou e-mail e senha — seu plano e sua lista te esperam.
                  </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login">Usuário ou e-mail</Label>
                    <div className="relative">
                      <User
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <Input
                        id="login"
                        type="text"
                        placeholder="ex: joao ou voce@exemplo.com"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        className="pl-10"
                        required
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <LockKeyhole
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  <ErrorText>{error}</ErrorText>

                  <Button variant="brand" className="w-full" disabled={loading} type="submit">
                    {loading ? "Entrando..." : "Bora lá!"}
                  </Button>

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-600">
                      Não tem conta?{" "}
                      <Link to="/register" className="font-extrabold text-emerald-700 hover:text-emerald-800 hover:underline">
                        Criar cadastro
                      </Link>
                    </p>
                  </div>
                </form>
              </Card>

              <p className="mt-4 text-center text-xs text-slate-500">
                Projeto acadêmico (TCC). Seus dados são usados apenas para gerar recomendações e métricas.
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

