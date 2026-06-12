/**
 * PDF da lista de compras agregada da semana — layout alinhado à identidade da página Compras.
 */

import { loadPdfMake } from "./pdfMakeClient.js";

function sortItems(items) {
  return [...(items || [])].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "pt-BR"));
}

function buildDocDefinition({ shoppingList, user }) {
  const year = new Date().getFullYear();
  const generatedAt = new Date().toLocaleString("pt-BR");
  const items = sortItems(shoppingList.items);
  const total = Number(shoppingList.estCost || 0);

  const who =
    user?.name && user?.email ? `${user.name} · ${user.email}` : user?.name || user?.email || "";
  const userLine = who
    ? {
        text: `Documento gerado para: ${who}`,
        style: "muted",
        margin: [0, 0, 0, 10],
      }
    : null;

  const tableBody = [
    [
      { text: "#", style: "th", alignment: "center" },
      { text: "Item", style: "th" },
      { text: "Quantidade", style: "th" },
      { text: "Custo est.", style: "th", alignment: "right" },
    ],
    ...(items.length
      ? items.map((it, i) => [
          { text: String(i + 1), alignment: "center", style: "td" },
          { text: String(it.name || "—"), style: "tdStrong" },
          { text: `${it.qty ?? ""}${it.unit ?? ""}`, style: "td" },
          {
            text: `R$ ${Number(it.estCost || 0).toFixed(2)}`,
            style: "td",
            alignment: "right",
          },
        ])
      : [
          [
            { text: "Nenhum item na lista.", style: "muted", colSpan: 4, alignment: "center" },
            {},
            {},
            {},
          ],
        ]),
    [
      {
        text: "Total estimado",
        style: "thTotal",
        colSpan: 3,
        alignment: "right",
      },
      {},
      {},
      {
        text: `R$ ${total.toFixed(2)}`,
        style: "thTotal",
        alignment: "right",
      },
    ],
  ];

  const tableRowCount = tableBody.length;

  const content = [
    {
      table: {
        widths: ["*"],
        body: [
          [
            {
              text: "NUTRI SEMANA · LISTA DE COMPRAS",
              style: "bannerText",
              fillColor: "#c2410c",
              margin: [14, 11, 14, 11],
            },
          ],
        ],
      },
      layout: "noBorders",
      margin: [0, 0, 0, 14],
    },
    {
      text: "Sacola da semana",
      style: "h1",
    },
    {
      text: "Quantidades somadas por ingrediente conforme seu plano alimentar atual — leve ao mercado e confira os preços de prateleira.",
      style: "subtitle",
      margin: [0, 4, 0, 8],
    },
    {
      text: `Referência do plano: ${shoppingList.dietPlanId || "—"}`,
      style: "mutedSmall",
      margin: [0, 0, 0, 12],
    },
    {
      columns: [
        {
          width: "*",
          text: `${items.length} item(ns) na lista`,
          style: "mutedSmall",
        },
        {
          width: "auto",
          text: `Emitido em ${generatedAt}`,
          style: "mutedSmall",
          alignment: "right",
        },
      ],
      margin: [0, 0, 0, 10],
    },
  ];

  if (userLine) content.push(userLine);

  content.push({
    table: {
      headerRows: 1,
      widths: [28, "*", 72, 70],
      body: tableBody,
    },
    layout: {
      fillColor: (rowIndex) => {
        if (rowIndex === 0) return "#ffedd5";
        if (rowIndex === tableRowCount - 1) return "#fed7aa";
        return rowIndex % 2 === 0 ? "#fff7ed" : null;
      },
      hLineColor: () => "#fdba74",
      vLineColor: () => "#fdba74",
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
    },
    margin: [0, 0, 0, 14],
  });

  content.push({
    stack: [
      {
        text: "Dicas",
        style: "h2",
        margin: [0, 0, 0, 6],
      },
      {
        ul: [
          "Os valores de custo são estimativas do aplicativo (TCC) — use como referência, não como orçamento exato.",
          "Agrupe itens por corredor no mercado para ganhar tempo.",
          "Se trocar alimentos no plano, gere um novo plano para atualizar esta lista.",
        ],
        style: "body",
        margin: [0, 0, 0, 0],
      },
    ],
    margin: [0, 8, 0, 12],
  });

  content.push({
    text: "—",
    alignment: "center",
    color: "#fdba74",
    margin: [0, 8, 0, 12],
  });

  content.push({
    stack: [
      {
        text: `© ${year} Nutri semana — Projeto acadêmico (TCC), curso de Sistemas de Informação.`,
        style: "legal",
      },
      {
        text: "Demonstração educacional. Não substitui orientação nutricional ou médica.",
        style: "legal",
        margin: [0, 4, 0, 0],
      },
      {
        text: "Lista gerada automaticamente; confira quantidades, unidades e validade dos produtos.",
        style: "legal",
        margin: [0, 4, 0, 0],
      },
    ],
  });

  return {
    pageSize: "A4",
    pageMargins: [40, 48, 40, 56],
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      lineHeight: 1.25,
      color: "#334155",
    },
    info: {
      title: "Nutri semana — Lista de compras",
      author: "Nutri semana",
      subject: "Lista de compras semanal",
    },
    styles: {
      bannerText: {
        bold: true,
        fontSize: 11,
        color: "#ffffff",
        letterSpacing: 0.8,
      },
      h1: { fontSize: 18, bold: true, color: "#9a3412" },
      h2: { fontSize: 11, bold: true, color: "#c2410c" },
      subtitle: { fontSize: 9.5, color: "#64748b" },
      th: { bold: true, fontSize: 9, color: "#9a3412" },
      thTotal: { bold: true, fontSize: 10, color: "#7c2d12" },
      td: { fontSize: 9.5 },
      tdStrong: { fontSize: 9.5, bold: true, color: "#0f172a" },
      body: { fontSize: 9.5 },
      muted: { fontSize: 9, color: "#64748b" },
      mutedSmall: { fontSize: 8, color: "#64748b" },
      legal: { fontSize: 8, color: "#64748b", italics: true },
      legalBox: { fontSize: 7.5, color: "#94a3b8", italics: true },
    },
    footer: (currentPage, pageCount) => ({
      margin: [40, 6, 40, 0],
      columns: [
        {
          width: "*",
          stack: [
            {
              text: `© ${year} Nutri semana · TCC — Sistemas de Informação · lista de compras`,
              fontSize: 7,
              color: "#94a3b8",
            },
          ],
        },
        {
          width: "auto",
          text: `${currentPage} / ${pageCount}`,
          fontSize: 7,
          color: "#94a3b8",
          alignment: "right",
        },
      ],
    }),
    content,
  };
}

/**
 * @param {{ shoppingList: { dietPlanId?: string, estCost: number, items: Array<object> }, user?: object | null }} opts
 */
export async function downloadShoppingListPdf({ shoppingList, user }) {
  if (!shoppingList?.items?.length) {
    throw new Error("Não há itens na lista para exportar.");
  }

  const pdfMake = await loadPdfMake();
  const dd = buildDocDefinition({ shoppingList, user });
  const safe = new Date().toISOString().slice(0, 10);
  const fileName = `nutri-semana-lista-compras-${safe}.pdf`;
  pdfMake.createPdf(dd).download(fileName);
}
