import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, KeyRound, Search, Shield, Trash2, Users, X } from "lucide-react";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import { Input, Label, Select } from "../components/FormField.jsx";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../state/auth.jsx";

const PAGE_SIZE = 12;

function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-800 ring-slate-200",
    emerald: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    amber: "bg-amber-50 text-amber-900 ring-amber-200",
    rose: "bg-rose-50 text-rose-900 ring-rose-200",
  };
  return (
    <span
      className={["inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ring-1", tones[tone] || tones.slate].join(" ")}
    >
      {children}
    </span>
  );
}

function goalLabel(goal) {
  if (!goal) return "—";
  if (goal === "lose") return "Perder";
  if (goal === "gain") return "Ganhar";
  if (goal === "maintain") return "Manter";
  return goal;
}

export default function AdminUsersPage() {
  const { token, user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [passwordFor, setPasswordFor] = useState(null);
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  function openPasswordModal(u) {
    setSuccessMsg("");
    setPasswordFor(u);
    setPwdNew("");
    setPwdConfirm("");
    setPwdError("");
  }

  function closePasswordModal() {
    setPasswordFor(null);
    setPwdNew("");
    setPwdConfirm("");
    setPwdError("");
  }

  async function submitPasswordChange(e) {
    e.preventDefault();
    if (!passwordFor) return;
    setPwdError("");
    if (pwdNew.length < 6) {
      setPwdError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (pwdNew !== pwdConfirm) {
      setPwdError("A confirmação não coincide com a nova senha.");
      return;
    }
    setPwdSaving(true);
    setError("");
    try {
      await apiFetch(`/api/admin/users/${passwordFor.id}/password`, {
        token,
        method: "PATCH",
        body: { password: pwdNew },
      });
      setSuccessMsg(`Senha de ${passwordFor.name} atualizada. O usuário deve usar a nova senha no próximo login.`);
      closePasswordModal();
    } catch (err) {
      setPwdError(err.message || "Falha ao atualizar senha.");
    } finally {
      setPwdSaving(false);
    }
  }

  async function load() {
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const data = await apiFetch("/api/admin/users", { token });
      setUsers(data.users || []);
    } catch (e) {
      setError(e.message || "Falha ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const totalAdmins = useMemo(() => users.filter((u) => u.role === "ADMIN").length, [users]);

  const filtered = useMemo(() => {
    let list = [...users];
    if (roleFilter !== "all") list = list.filter((u) => u.role === roleFilter);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          String(u.name || "")
            .toLowerCase()
            .includes(q) ||
          String(u.email || "")
            .toLowerCase()
            .includes(q) ||
          String(u.username || "")
            .toLowerCase()
            .includes(q),
      );
    }
    return list;
  }, [users, query, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query, roleFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  async function patchUserRole(id, role) {
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/api/admin/users/${id}/role`, { token, method: "PATCH", body: { role } });
      await load();
    } catch (e) {
      setError(e.message || "Falha ao atualizar role.");
    } finally {
      setSaving(false);
    }
  }

  async function removeUser(id) {
    if (!window.confirm("Excluir este usuário? Esta ação é irreversível.")) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/api/admin/users/${id}`, { token, method: "DELETE" });
      await load();
    } catch (e) {
      setError(e.message || "Falha ao excluir.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="bg-gradient-to-r from-teal-700 to-emerald-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            Admin • Usuários
          </h2>
          <p className="text-sm font-medium text-slate-700">Lista densa, busca e filtros — escala com muitas contas.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
          <Users size={18} />
          Atualizar
        </Button>
      </div>

      {error ? <Card className="text-sm text-rose-700">{error}</Card> : null}
      {successMsg ? (
        <Card className="border-2 border-emerald-200/80 bg-emerald-50/90 text-sm font-medium text-emerald-900">
          {successMsg}
        </Card>
      ) : null}

      <Card className="bg-white/90 backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="emerald">{users.length} total</Badge>
            <Badge tone="amber">{totalAdmins} admin</Badge>
            {query || roleFilter !== "all" ? (
              <Badge tone="rose">
                {filtered.length} filtrado{filtered.length !== 1 ? "s" : ""}
              </Badge>
            ) : null}
          </div>
          <p className="text-xs font-medium text-slate-600">
            Sessão: <span className="font-extrabold text-emerald-800">{me?.username || me?.email}</span>
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600/70"
              aria-hidden
            />
            <Input
              placeholder="Buscar por nome, e-mail ou usuário…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 pl-10 text-sm"
              aria-label="Buscar usuários"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-emerald-900/80">
              Papel
            </label>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 text-sm"
            >
              <option value="all">Todos</option>
              <option value="USER">Somente USER</option>
              <option value="ADMIN">Somente ADMIN</option>
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card>Carregando...</Card>
      ) : (
        <>
          {/* Desktop: tabela */}
          <Card className="hidden overflow-hidden p-0 md:block">
            <div className="max-h-[min(70vh,720px)] overflow-auto">
              <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 font-extrabold">Nome</th>
                    <th className="whitespace-nowrap px-4 py-3 font-extrabold">E-mail</th>
                    <th className="whitespace-nowrap px-4 py-3 font-extrabold">Usuário</th>
                    <th className="whitespace-nowrap px-4 py-3 font-extrabold">Meta</th>
                    <th className="whitespace-nowrap px-4 py-3 font-extrabold">LGPD</th>
                    <th className="whitespace-nowrap px-4 py-3 font-extrabold">Criado</th>
                    <th className="whitespace-nowrap px-4 py-3 font-extrabold">Papel</th>
                    <th className="whitespace-nowrap px-4 py-3 font-extrabold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100/80 bg-white/95">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-slate-600">
                        Nenhum usuário com estes filtros.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((u, idx) => {
                      const isSelf = me?.id === u.id;
                      const stripe = idx % 2 === 0 ? "bg-white" : "bg-emerald-50/40";
                      return (
                        <tr key={u.id} className={["align-middle transition hover:bg-amber-50/50", stripe].join(" ")}>
                          <td className="max-w-[160px] px-4 py-2.5">
                            <p className="truncate font-extrabold text-slate-900">{u.name}</p>
                            {isSelf ? (
                              <span className="text-[10px] font-bold text-teal-700">você</span>
                            ) : null}
                          </td>
                          <td className="max-w-[200px] px-4 py-2.5">
                            <p className="truncate text-slate-700" title={u.email}>
                              {u.email}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold text-slate-600">
                            @{u.username || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-xs font-bold text-slate-800">
                            {goalLabel(u.goal)}
                          </td>
                          <td className="px-4 py-2.5">
                            {u.consentLgpd ? (
                              <Badge tone="emerald">ok</Badge>
                            ) : (
                              <Badge tone="rose">pend.</Badge>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-600">
                            {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5">
                            <Select
                              value={u.role}
                              onChange={(e) => patchUserRole(u.id, e.target.value)}
                              disabled={saving || isSelf}
                              className="h-9 min-w-[110px] text-xs"
                            >
                              <option value="USER">USER</option>
                              <option value="ADMIN">ADMIN</option>
                            </Select>
                            {isSelf ? (
                              <p className="mt-0.5 text-[10px] text-slate-500">bloqueado</p>
                            ) : null}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right">
                            <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-9 px-3"
                                onClick={() => openPasswordModal(u)}
                                disabled={saving}
                                aria-label={`Trocar senha de ${u.name}`}
                                title="Definir nova senha"
                              >
                                <KeyRound size={16} />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                className="h-9 px-3"
                                onClick={() => removeUser(u.id)}
                                disabled={saving || isSelf}
                                aria-label={`Excluir ${u.name}`}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-emerald-100 bg-emerald-50/50 px-4 py-3 text-xs font-medium text-slate-700">
              <span>
                Página {page} de {totalPages} • {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-9"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={18} />
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-9"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Próxima
                  <ChevronRight size={18} />
                </Button>
              </div>
            </div>
          </Card>

          {/* Mobile: linhas compactas */}
          <div className="space-y-2 md:hidden">
            {paginated.length === 0 ? (
              <Card className="py-8 text-center text-sm text-slate-600">Nenhum usuário com estes filtros.</Card>
            ) : (
              paginated.map((u) => {
                const isSelf = me?.id === u.id;
                return (
                  <Card key={u.id} className="space-y-2 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-slate-900">{u.name}</p>
                        <p className="truncate text-xs text-slate-600">{u.email}</p>
                        <p className="text-[11px] text-slate-500">@{u.username}</p>
                      </div>
                      {u.role === "ADMIN" ? <Badge tone="amber">ADMIN</Badge> : <Badge tone="slate">USER</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                      <span className="font-bold text-slate-800">Meta: {goalLabel(u.goal)}</span>
                      <span>•</span>
                      <span>LGPD: {u.consentLgpd ? "ok" : "pend."}</span>
                      <span>•</span>
                      <span>{new Date(u.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="min-w-0 flex-1 basis-[120px]">
                        <Select
                          value={u.role}
                          onChange={(e) => patchUserRole(u.id, e.target.value)}
                          disabled={saving || isSelf}
                          className="h-10 text-sm"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </Select>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-10 shrink-0 px-3"
                        onClick={() => openPasswordModal(u)}
                        disabled={saving}
                        aria-label="Trocar senha"
                      >
                        <KeyRound size={18} />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="h-10 shrink-0 px-3"
                        onClick={() => removeUser(u.id)}
                        disabled={saving || isSelf}
                        aria-label="Excluir"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
            {totalPages > 1 ? (
              <div className="flex items-center justify-between rounded-2xl bg-white/90 px-3 py-2 ring-2 ring-emerald-100">
                <span className="text-xs font-medium text-slate-700">
                  {page}/{totalPages}
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-9" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight size={18} />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}

      <Card className="space-y-2 border-2 border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-emerald-700" />
          <p className="text-sm font-extrabold text-emerald-900">Boas práticas (TCC)</p>
        </div>
        <p className="text-sm font-medium text-slate-700">
          Em produção, exclusão e alteração de papel exigiriam auditoria e confirmação reforçada. Este painel demonstra
          controle de acesso no contexto acadêmico. A troca de senha pelo admin deve ser registrada em log em ambientes
          reais.
        </p>
      </Card>

      {passwordFor ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
            aria-label="Fechar"
            onClick={() => !pwdSaving && closePasswordModal()}
          />
          <Card className="relative z-10 w-full max-w-md shadow-2xl ring-2 ring-emerald-200/80">
            <div className="flex items-start justify-between gap-3 border-b border-emerald-100 pb-3">
              <div>
                <p className="text-sm font-extrabold text-emerald-900">Definir nova senha</p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {passwordFor.name}{" "}
                  <span className="text-slate-500">({passwordFor.email})</span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 shrink-0 px-2"
                onClick={closePasswordModal}
                disabled={pwdSaving}
                aria-label="Fechar"
              >
                <X size={18} />
              </Button>
            </div>
            <form onSubmit={submitPasswordChange} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-pwd-new">Nova senha</Label>
                <Input
                  id="admin-pwd-new"
                  type="password"
                  autoComplete="new-password"
                  value={pwdNew}
                  onChange={(e) => setPwdNew(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-pwd-confirm">Confirmar senha</Label>
                <Input
                  id="admin-pwd-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={pwdConfirm}
                  onChange={(e) => setPwdConfirm(e.target.value)}
                  placeholder="Repita a nova senha"
                  minLength={6}
                  required
                />
              </div>
              {pwdError ? <p className="text-sm font-semibold text-rose-700">{pwdError}</p> : null}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" className="w-full sm:w-auto" disabled={pwdSaving} onClick={closePasswordModal}>
                  Cancelar
                </Button>
                <Button type="submit" variant="brand" className="w-full sm:w-auto" disabled={pwdSaving}>
                  {pwdSaving ? "Salvando..." : "Salvar senha"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
