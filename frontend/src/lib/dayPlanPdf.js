/**
 * Gera PDF do plano alimentar de um único dia (layout legível + rodapé/copyright).
 * Usa pdfmake (Roboto no vfs) para suportar acentuação em pt-BR.
 */

import { loadPdfMake } from "./pdfMakeClient.js";

const mealOrder = { breakfast: 1, lunch: 2, snack: 3, dinner: 4 };

const mealLabel = {
  breakfast: "Café da manhã",
  lunch: "Almoço",
  dinner: "Jantar",
  snack: "Lanche",
};

function sortMeals(meals) {
  return [...(meals || [])].sort((a, b) => (mealOrder[a.mealType] || 99) - (mealOrder[b.mealType] || 99));
}

function formatWeekStartShort(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR");
}

function getCalendarDayLabel(weekStartIso, dayIndex) {
  if (!weekStartIso) return null;
  const base = new Date(weekStartIso);
  if (Number.isNaN(base.getTime())) return null;
  const d = new Date(base);
  d.setDate(d.getDate() + dayIndex);
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function dayTotals(meals) {
  return meals.reduce(
    (acc, m) => {
      acc.kcal += Number(m.caloriesKcal || 0);
      acc.p += Number(m.proteinG || 0);
      acc.c += Number(m.carbsG || 0);
      acc.g += Number(m.fatG || 0);
      return acc;
    },
    { kcal: 0, p: 0, c: 0, g: 0 },
  );
}

function buildDocDefinition({ plan, day, user }) {
  const year = new Date().getFullYear();
  const generatedAt = new Date().toLocaleString("pt-BR");
  const meals = sortMeals(day.meals);
  const totals = dayTotals(meals);
  const calLabel = getCalendarDayLabel(plan.weekStart, day.dayIndex);
  const weekStartFmt = formatWeekStartShort(plan.weekStart);

  const who =
    user?.name && user?.email ? `${user.name} · ${user.email}` : user?.name || user?.email || "";
  const userLine = who
    ? {
        text: `Documento gerado para: ${who}`,
        style: "muted",
        margin: [0, 0, 0, 10],
      }
    : null;

  const content = [
    {
      table: {
        widths: ["*"],
        body: [
          [
            {
              text: "NUTRI SEMANA",
              style: "bannerText",
              fillColor: "#059669",
              margin: [14, 11, 14, 11],
            },
          ],
        ],
      },
      layout: "noBorders",
      margin: [0, 0, 0, 14],
    },
    {
      text: "Plano alimentar do dia",
      style: "h1",
    },
    {
      text: calLabel
        ? `${calLabel.charAt(0).toUpperCase()}${calLabel.slice(1)} · ${weekStartFmt ? `Semana iniciando em ${weekStartFmt}` : `Dia ${day.dayIndex + 1} de 7`}`
        : `Dia ${day.dayIndex + 1} de 7`,
      style: "subtitle",
      margin: [0, 4, 0, 12],
    },
    {
      table: {
        widths: ["*", "*", "*"],
        body: [
          [
            {
              stack: [
                { text: "Meta calórica (plano)", style: "metaLabel" },
                {
                  text: `${plan.targets.caloriesKcal} kcal/dia`,
                  style: "metaValue",
                  margin: [0, 2, 0, 0],
                },
              ],
              fillColor: "#ecfdf5",
              margin: [10, 10, 10, 10],
            },
            {
              stack: [
                { text: "Macros alvo (P / C / G)", style: "metaLabel" },
                {
                  text: `${plan.targets.proteinG} g  ·  ${plan.targets.carbsG} g  ·  ${plan.targets.fatG} g`,
                  style: "metaValue",
                  margin: [0, 2, 0, 0],
                },
              ],
              fillColor: "#f0f9ff",
              margin: [10, 10, 10, 10],
            },
            {
              stack: [
                { text: "Total estimado neste dia", style: "metaLabel" },
                {
                  text: `${Math.round(totals.kcal)} kcal`,
                  style: "metaValue",
                  margin: [0, 2, 0, 0],
                },
                {
                  text: `P ${Math.round(totals.p)} g · C ${Math.round(totals.c)} g · G ${Math.round(totals.g)} g`,
                  style: "mutedSmall",
                  margin: [0, 4, 0, 0],
                },
              ],
              fillColor: "#fffbeb",
              margin: [10, 10, 10, 10],
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => "#d1fae5",
        vLineColor: () => "#d1fae5",
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0,
      },
      margin: [0, 0, 0, 8],
    },
    {
      columns: [
        {
          width: "*",
          text: `Custo semanal estimado do plano: R$ ${Number(plan.estWeeklyCost || 0).toFixed(2)}`,
          style: "mutedSmall",
        },
        {
          width: "auto",
          text: `Emitido em ${generatedAt}`,
          style: "mutedSmall",
          alignment: "right",
        },
      ],
      margin: [0, 0, 0, 12],
    },
  ];

  if (userLine) content.push(userLine);

  for (const meal of meals) {
    const label = mealLabel[meal.mealType] || meal.name || "Refeição";
    const completedTag = meal.completed ? " · Concluída" : "";
    content.push({
      text: `${label}${completedTag}`,
      style: "h2",
      margin: [0, 12, 0, 6],
    });
    content.push({
      text: `${Math.round(meal.caloriesKcal || 0)} kcal   ·   P ${Math.round(meal.proteinG || 0)} g   ·   C ${Math.round(meal.carbsG || 0)} g   ·   G ${Math.round(meal.fatG || 0)} g`,
      style: "macroLine",
      margin: [0, 0, 0, 8],
    });

    const items = meal.items || [];
    const ingBody = [
      [
        { text: "Alimento", style: "th" },
        { text: "Porção", style: "th" },
        { text: "Energia", style: "th" },
      ],
      ...(items.length
        ? items.map((it) => [
            String(it.name || "—"),
            `${it.qty ?? ""}${it.unit ?? ""}`,
            it.caloriesKcal != null ? `${Math.round(it.caloriesKcal)} kcal` : "—",
          ])
        : [[{ text: "Nenhum alimento listado nesta refeição.", style: "muted", colSpan: 3 }, {}, {}]]),
    ];

    content.push({
      table: {
        headerRows: 1,
        widths: ["*", 72, 56],
        body: ingBody,
      },
      layout: {
        fillColor: (i) => (i === 0 ? "#d1fae5" : i % 2 === 0 ? "#f8fafc" : null),
        hLineColor: () => "#e2e8f0",
        vLineColor: () => "#e2e8f0",
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
      },
      margin: [0, 0, 0, 10],
    });

    if (meal.explanation) {
      content.push({
        text: "Por que essa refeição foi recomendada?",
        style: "h3",
        margin: [0, 4, 0, 4],
      });
      content.push({
        text: String(meal.explanation),
        style: "body",
        margin: [0, 0, 0, 10],
      });
    }

    const recipes = meal.recipeIdeas || [];
    if (recipes.length > 0) {
      content.push({
        text: "Sugestões de receita",
        style: "h3",
        margin: [0, 4, 0, 6],
      });
      for (const r of recipes) {
        const block = [
          { text: r.title || "Receita", style: "recipeTitle" },
          r.prepMinutes != null
            ? {
                text: `Tempo estimado: ~${r.prepMinutes} min`,
                style: "mutedSmall",
                margin: [0, 2, 0, 4],
              }
            : null,
          r.summary ? { text: r.summary, style: "body", margin: [0, 0, 0, 4] } : null,
        ].filter(Boolean);

        if (Array.isArray(r.steps) && r.steps.length) {
          block.push({
            ol: r.steps.map((s) => String(s)),
            style: "body",
            margin: [0, 0, 0, 4],
          });
        }
        if (r.disclaimer) {
          block.push({ text: r.disclaimer, style: "legalBox", margin: [0, 2, 0, 0] });
        }
        content.push({
          stack: [
            {
              canvas: [
                {
                  type: "line",
                  x1: 0,
                  y1: 0,
                  x2: 515,
                  y2: 0,
                  lineWidth: 0.5,
                  lineColor: "#cbd5e1",
                },
              ],
              margin: [0, 0, 0, 8],
            },
            ...block,
          ],
          margin: [0, 0, 0, 10],
        });
      }
    }
  }

  content.push({
    text: "—",
    alignment: "center",
    color: "#cbd5e1",
    margin: [0, 16, 0, 12],
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
        text: "Conteúdo gerado pelo aplicativo; verifique alergias, restrições e porções na sua realidade.",
        style: "legal",
        margin: [0, 4, 0, 0],
      },
    ],
    margin: [0, 0, 0, 8],
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
      title: `Nutri semana — Plano do dia ${day.dayIndex + 1}`,
      author: "Nutri semana",
      subject: "Plano alimentar",
    },
    styles: {
      bannerText: {
        bold: true,
        fontSize: 12,
        color: "#ffffff",
        letterSpacing: 1.2,
      },
      h1: { fontSize: 18, bold: true, color: "#0f172a" },
      subtitle: { fontSize: 9.5, color: "#64748b" },
      h2: { fontSize: 13, bold: true, color: "#065f46" },
      h3: { fontSize: 10.5, bold: true, color: "#0f766e" },
      metaLabel: { fontSize: 8, bold: true, color: "#475569" },
      metaValue: { fontSize: 12, bold: true, color: "#0f172a" },
      macroLine: { fontSize: 9.5, color: "#475569" },
      th: { bold: true, fontSize: 9, color: "#14532d" },
      body: { fontSize: 9.5 },
      muted: { fontSize: 9, color: "#64748b" },
      mutedSmall: { fontSize: 8, color: "#64748b" },
      recipeTitle: { fontSize: 10.5, bold: true, color: "#134e4a" },
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
              text: `© ${year} Nutri semana · TCC — Sistemas de Informação · uso educacional`,
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
 * @param {{ plan: object, day: object, user?: object | null }} opts
 */
export async function downloadDayPlanPdf({ plan, day, user }) {
  if (!plan || !day?.meals?.length) {
    throw new Error("Não há refeições neste dia para exportar.");
  }

  const pdfMake = await loadPdfMake();
  const dd = buildDocDefinition({ plan, day, user });
  const safe = new Date().toISOString().slice(0, 10);
  const fileName = `nutri-semana-dia-${day.dayIndex + 1}-${safe}.pdf`;
  pdfMake.createPdf(dd).download(fileName);
}
