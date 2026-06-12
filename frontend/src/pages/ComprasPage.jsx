import React, { useEffect, useState } from "react";
import { FileDown, ShoppingBasket } from "lucide-react";
import Card from "../components/Card.jsx";
import ResponsiveGrid from "../components/ResponsiveGrid.jsx";
import Button from "../components/Button.jsx";
import { apiFetch } from "../lib/api.js";
import { downloadShoppingListPdf } from "../lib/shoppingListPdf.js";
import { useAuth } from "../state/auth.jsx";

export default function ComprasPage() {
  const { token, user } = useAuth();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfExporting, setPdfExporting] = useState(false);
  const [pdfError, setPdfError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/shopping-list", { token });
      setList(data.shoppingList);
    } catch (e) {
      setList(null);
      setError(e.message || "Sem lista.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function onExportPdf() {
    if (!list?.items?.length) return;
    setPdfError("");
    setPdfExporting(true);
    try {
      await downloadShoppingListPdf({ shoppingList: list, user });
    } catch (e) {
      setPdfError(e?.message || "Não foi possível gerar o PDF.");
    } finally {
      setPdfExporting(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            Sacola da semana
          </h2>
          <p className="text-sm font-medium text-slate-700">
            Tudo que você precisa levar no mercado, com quantidades somadas e custo estimado.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {list?.items?.length ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto"
              disabled={pdfExporting}
              onClick={onExportPdf}
            >
              <FileDown size={18} />
              {pdfExporting ? "Gerando PDF..." : "Exportar PDF"}
            </Button>
          ) : null}
          <Button variant="accent" size="sm" className="w-full sm:w-auto" onClick={load} disabled={loading}>
            <ShoppingBasket size={18} />
            Atualizar
          </Button>
        </div>
      </div>

      {error ? <Card className="text-sm text-rose-700">{error}</Card> : null}
      {pdfError ? <Card className="text-sm text-rose-700">{pdfError}</Card> : null}

      {loading ? (
        <Card>Carregando...</Card>
      ) : !list ? (
        <Card className="space-y-2">
          <p className="font-semibold text-slate-900">Nenhuma lista encontrada.</p>
          <p className="text-sm text-slate-600">
            Gere um plano em <span className="font-semibold">Plano alimentar</span>.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Custo total estimado</p>
              <p className="text-2xl font-extrabold tracking-tight">R$ {Number(list.estCost).toFixed(2)}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-3 text-white shadow-citrus">
              <ShoppingBasket size={20} />
            </div>
          </Card>

          <ResponsiveGrid className="lg:grid-cols-2 xl:grid-cols-3">
            {(list.items || []).map((it) => (
              <Card key={it.foodId} className="space-y-1">
                <p className="font-extrabold text-slate-900">{it.name}</p>
                <p className="text-sm text-slate-600">
                  Quantidade:{" "}
                  <span className="font-semibold text-slate-900">
                    {it.qty}
                    {it.unit}
                  </span>
                </p>
                <p className="text-sm text-slate-600">
                  Custo estimado:{" "}
                  <span className="font-semibold text-slate-900">R$ {Number(it.estCost).toFixed(2)}</span>
                </p>
              </Card>
            ))}
          </ResponsiveGrid>
        </div>
      )}
    </div>
  );
}

