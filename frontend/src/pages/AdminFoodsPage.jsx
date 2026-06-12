import React, { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, UtensilsCrossed } from "lucide-react";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import ResponsiveGrid from "../components/ResponsiveGrid.jsx";
import { ErrorText, Helper, Input, Label, Select, Textarea } from "../components/FormField.jsx";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../state/auth.jsx";

const categories = ["protein", "carb", "fat", "veg", "fruit", "dairy"];
const units = ["g", "un", "ml"];

function FoodForm({ value, onChange, onSubmit, submitLabel, loading }) {
  function setField(k, v) {
    onChange({ ...value, [k]: v });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" value={value.name} onChange={(e) => setField("name", e.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category">Categoria</Label>
          <Select id="category" value={value.category} onChange={(e) => setField("category", e.target.value)} required>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Helper>Usada para substituições e montagem da refeição.</Helper>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="unit">Unidade</Label>
          <Select id="unit" value={value.unit} onChange={(e) => setField("unit", e.target.value)} required>
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="defaultQty">Quantidade padrão</Label>
          <Input
            id="defaultQty"
            type="number"
            inputMode="decimal"
            value={value.defaultQty}
            onChange={(e) => setField("defaultQty", e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="costPer100g">Custo por 100g (ou 100ml)</Label>
          <Input
            id="costPer100g"
            type="number"
            inputMode="decimal"
            value={value.costPer100g}
            onChange={(e) => setField("costPer100g", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="caloriesKcal">Calorias (kcal)</Label>
          <Input
            id="caloriesKcal"
            type="number"
            inputMode="decimal"
            value={value.caloriesKcal}
            onChange={(e) => setField("caloriesKcal", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="proteinG">Proteína (g)</Label>
          <Input
            id="proteinG"
            type="number"
            inputMode="decimal"
            value={value.proteinG}
            onChange={(e) => setField("proteinG", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="carbsG">Carboidrato (g)</Label>
          <Input
            id="carbsG"
            type="number"
            inputMode="decimal"
            value={value.carbsG}
            onChange={(e) => setField("carbsG", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fatG">Gordura (g)</Label>
          <Input
            id="fatG"
            type="number"
            inputMode="decimal"
            value={value.fatG}
            onChange={(e) => setField("fatG", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags (CSV)</Label>
        <Textarea
          id="tags"
          value={value.tags}
          onChange={(e) => setField("tags", e.target.value)}
          placeholder="Ex: vegetarian,vegan,contains_gluten,contains_lactose,gluten_free,lactose_free"
        />
        <Helper>As restrições do usuário são comparadas com essas tags.</Helper>
      </div>

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        <Save size={18} />
        {loading ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}

export default function AdminFoodsPage() {
  const { token } = useAuth();
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [draft, setDraft] = useState({
    name: "",
    category: "protein",
    caloriesKcal: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    costPer100g: 0,
    unit: "g",
    defaultQty: 100,
    tags: "",
  });

  const [editing, setEditing] = useState(null); // food id or null

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/admin/foods", { token });
      setFoods(data.foods || []);
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

  const editingFood = useMemo(() => foods.find((f) => f.id === editing) || null, [foods, editing]);

  async function onCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...draft,
        caloriesKcal: Number(draft.caloriesKcal),
        proteinG: Number(draft.proteinG),
        carbsG: Number(draft.carbsG),
        fatG: Number(draft.fatG),
        costPer100g: Number(draft.costPer100g),
        defaultQty: Number(draft.defaultQty),
      };
      await apiFetch("/api/admin/foods", { token, body: payload });
      setDraft((d) => ({ ...d, name: "", tags: "" }));
      await load();
    } catch (e2) {
      setError(e2.message || "Falha ao criar.");
    } finally {
      setSaving(false);
    }
  }

  async function onUpdate(e) {
    e.preventDefault();
    if (!editingFood) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...editingFood,
        caloriesKcal: Number(editingFood.caloriesKcal),
        proteinG: Number(editingFood.proteinG),
        carbsG: Number(editingFood.carbsG),
        fatG: Number(editingFood.fatG),
        costPer100g: Number(editingFood.costPer100g),
        defaultQty: Number(editingFood.defaultQty),
      };
      await apiFetch(`/api/admin/foods/${editingFood.id}`, { token, method: "PATCH", body: payload });
      await load();
    } catch (e2) {
      setError(e2.message || "Falha ao atualizar.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Excluir este alimento?")) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/api/admin/foods/${id}`, { token, method: "DELETE" });
      if (editing === id) setEditing(null);
      await load();
    } catch (e2) {
      setError(e2.message || "Falha ao excluir.");
    } finally {
      setSaving(false);
    }
  }

  function setEditingField(k, v) {
    setFoods((prev) => prev.map((f) => (f.id === editing ? { ...f, [k]: v } : f)));
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Admin • Alimentos</h2>
          <p className="text-sm text-slate-600">
            Gerencie a base de alimentos usada pelo algoritmo (substituições, custo e variedade).
          </p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <UtensilsCrossed size={18} />
          Recarregar
        </Button>
      </div>

      <ErrorText>{error}</ErrorText>

      <ResponsiveGrid className="lg:grid-cols-2">
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-extrabold text-slate-900">Novo alimento</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
              <Plus size={14} />
              Cadastro
            </span>
          </div>
          <FoodForm
            value={draft}
            onChange={setDraft}
            onSubmit={onCreate}
            submitLabel="Adicionar"
            loading={saving}
          />
        </Card>

        <Card className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm font-extrabold text-slate-900">Editar alimento</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Select
                value={editing || ""}
                onChange={(e) => setEditing(e.target.value || null)}
                className="max-w-xs"
              >
                <option value="">Selecione...</option>
                {(foods || []).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>

              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={saving || !editing}
                onClick={() => onDelete(editing)}
                aria-label="Remover alimento selecionado"
                className="h-10"
              >
                <Trash2 size={18} />
                Remover
              </Button>
            </div>
          </div>

          {!editingFood ? (
            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-sm text-slate-600">Selecione um alimento para editar.</p>
            </div>
          ) : (
            <form onSubmit={onUpdate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Nome</Label>
                  <Input value={editingFood.name} onChange={(e) => setEditingField("name", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Categoria</Label>
                  <Select value={editingFood.category} onChange={(e) => setEditingField("category", e.target.value)}>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Unidade</Label>
                  <Select value={editingFood.unit} onChange={(e) => setEditingField("unit", e.target.value)}>
                    {units.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Qtd padrão</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={editingFood.defaultQty}
                    onChange={(e) => setEditingField("defaultQty", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Custo/100</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={editingFood.costPer100g}
                    onChange={(e) => setEditingField("costPer100g", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Kcal</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={editingFood.caloriesKcal}
                    onChange={(e) => setEditingField("caloriesKcal", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Proteína (g)</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={editingFood.proteinG}
                    onChange={(e) => setEditingField("proteinG", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Carbo (g)</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={editingFood.carbsG}
                    onChange={(e) => setEditingField("carbsG", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Gordura (g)</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={editingFood.fatG}
                    onChange={(e) => setEditingField("fatG", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Tags (CSV)</Label>
                <Textarea value={editingFood.tags || ""} onChange={(e) => setEditingField("tags", e.target.value)} />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={saving}>
                  <Save size={18} />
                  {saving ? "Salvando..." : "Salvar alterações"}
                </Button>
                <Button type="button" variant="danger" disabled={saving} onClick={() => onDelete(editingFood.id)}>
                  <Trash2 size={18} />
                  Excluir
                </Button>
              </div>
            </form>
          )}
        </Card>
      </ResponsiveGrid>
    </div>
  );
}

