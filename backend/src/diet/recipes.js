/**
 * Sugestões de receitas heurísticas a partir dos alimentos do plano (sem API externa).
 * Serve como “IA simulada” / apoio educativo no TCC.
 */

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function blobItems(items) {
  return (Array.isArray(items) ? items : []).map((i) => normalize(i.name)).join(" | ");
}

function hasAny(blob, needles) {
  return needles.some((n) => blob.includes(normalize(n)));
}

function qtyLine(it) {
  const u = it.unit || "g";
  return `${it.name} (${Math.round(Number(it.qty) || 0)}${u})`;
}

function mealContext(mealType) {
  const map = {
    breakfast: { label: "café da manhã", hint: "Comece o dia com proteína + fibra para saciar." },
    lunch: { label: "almoço", hint: "Equilibre prato com cores (veg + fonte de proteína)." },
    dinner: { label: "jantar", hint: "Prefira preparos leves à noite, se possível." },
    snack: { label: "lanche", hint: "Combine carboidrato de qualidade com proteína ou gordura boa." },
  };
  return map[mealType] || { label: "refeição", hint: "Monte por grupos: proteína, carboidrato, vegetais." };
}

/**
 * @param {{ mealType: string, items: Array<{ name: string, qty: number, unit: string }> }} param0
 * @returns {Array<{ title: string, prepMinutes: number, summary: string, steps: string[], disclaimer?: string }>}
 */
export function suggestRecipesForMeal({ mealType, items }) {
  const arr = Array.isArray(items) ? items : [];
  const blob = blobItems(arr);
  const out = [];
  const push = (r) => {
    if (!r || out.length >= 3) return;
    if (out.some((x) => x.title === r.title)) return;
    out.push({
      ...r,
      disclaimer: "Sugestão ilustrativa baseada nos itens do plano. Ajuste temperos, sal e técnica à sua preferência.",
    });
  };

  const ing = arr.map(qtyLine).join("; ");
  const ctx = mealContext(mealType);

  // —— Clássicos BR ——
  if (hasAny(blob, ["feijao"]) && hasAny(blob, ["arroz"])) {
    push({
      title: "Arroz + feijão (prato montado)",
      prepMinutes: 20,
      summary: "Base brasileira: arroz e feijão com os acompanhamentos do seu plano.",
      steps: [
        "Reaqueça o arroz e o feijão (panela com um fio de água ou micro-ondas tampado) sem deixar secar.",
        "Enquanto isso, prepare o acompanhamento proteico (grelhar, refogar breve ou apenas aquecer, conforme o item).",
        `Monte o prato: arroz, feijão e os demais itens — ${ing}.`,
        "Finalize com bastante vegetal ou salada, se estiver na lista, para fibras e frescor.",
      ],
    });
  }

  // Frango / carne suína / patinho + carboidrato
  if (
    hasAny(blob, ["frango", "lombo", "suino", "bovina", "patinho", "carne"]) &&
    hasAny(blob, ["arroz", "quinoa", "batata", "mandioca", "macarrao", "cuscuz"])
  ) {
    push({
      title: "Proteína grelhada/refogada com acompanhamento",
      prepMinutes: 25,
      summary: "Proteína como centro do prato + carboidrato complexo na porção sugerida.",
      steps: [
        "Tempere a proteína com sal, pimenta e alho (ou temperos a gosto).",
        "Grelhe na frigideira antiaderente ou asse até cozimento seguro; evite exceder o óleo.",
        "Prepare o carboidrato conforme o item (reaquecer cozido ou finalizar macarrão al dente).",
        `Sirva junto: ${ing}.`,
        "Adicione os vegetais crus ou rapidamente refogados para completar o prato.",
      ],
    });
  }

  // Peixes / atum
  if (hasAny(blob, ["salmao", "sardinha", "atum", "peixe"])) {
    push({
      title: "Peixe ou conserva de atum no prato",
      prepMinutes: 18,
      summary: "Opção rica em ômega-3 (quando há peixe) ou refeição prática com atum.",
      steps: [
        hasAny(blob, ["salmao", "sardinha", "peixe"])
          ? "Tempere o filtro/peito de peixe e grelhe ou asse 10–15 min (até o ponto seguro)."
          : "Escorra o atum se vier em conserva e misture com os demais ingredientes do plano.",
        "Monte com o carboidrato e vegetais indicados, criando um prato colorido.",
        `Ingredientes previstos: ${ing}.`,
        "Um fio de azeite (se estiver no plano) pode finalizar o sabor.",
      ],
    });
  }

  // Café: ovos + pão
  if (mealType === "breakfast" && hasAny(blob, ["ovo"]) && hasAny(blob, ["pao"])) {
    push({
      title: "Ovos com pão integral",
      prepMinutes: 12,
      summary: "Combinação clássica de proteína + carboidrato de manhã.",
      steps: [
        "Prepare os ovos (cozidos conforme o plano ou mexidos na frigideira antiaderente).",
        "Toste levemente o pão integral (opcional) e monte um sanduíche ou prato aberto.",
        `Use as quantidades sugeridas: ${ing}.`,
        "Inclua a fruta do plano ao lado para fibras e micronutrientes.",
      ],
    });
  }

  // Aveia + fruta (+ leite / bebida vegetal)
  if (mealType === "breakfast" && hasAny(blob, ["aveia"])) {
    push({
      title: "Mingau de aveia com fruta",
      prepMinutes: 10,
      summary: "Café aquecido e saciante com aveia + fruta.",
      steps: [
        "Em panela pequena, coloque aveia com água ou bebida láctea/vegetal do seu hábito (respeitando o plano).",
        "Cozinhe em fogo baixo até engrossar, mexendo — ajuste líquido se ficar muito espesso.",
        "Descanse 1–2 min, transfira para tigela e adicione as frutas indicadas picadas.",
        `Itens do plano: ${ing}.`,
        "Opcional: canela em pó na própria dieta (sem açúcar extra).",
      ],
    });
  }

  // Vegano: tofu / tempeh / PTS
  if (hasAny(blob, ["tofu", "tempeh", "pts", "proteina de soja", "texturizada"])) {
    push({
      title: "Refogado ou bowl proteico vegetal",
      prepMinutes: 22,
      summary: "Destaque para proteína vegetal bem temperada.",
      steps: [
        "Drene o tofu e sele se quiser textura mais firme; PTS pode hidratar brevemente se estiver seca.",
        "Refogue com pouco óleo (se permitido no plano), alho e os vegetais da lista em cubos.",
        "Incorpore o carboidrato já cozido (arroz, quinoa ou macarrão) e ajuste sal.",
        `Ingredientes: ${ing}.`,
      ],
    });
  }

  // Iogurte + fruta
  if (hasAny(blob, ["iogurte"]) && hasAny(blob, ["banana", "maca", "morango", "mamao", "manga"])) {
    push({
      title: "Tigela de iogurte com frutas",
      prepMinutes: 8,
      summary: "Refeição leve, ideal para lanche ou café mais fresco.",
      steps: [
        "Coloque o iogurte na tigela.",
        "Corte as frutas em cubos ou fatias e distribua por cima.",
        `Montagem com: ${ing}.`,
        "Se houver castanhas/oleaginosas no plano, use como crocância final.",
      ],
    });
  }

  // Lanche genérico
  if (mealType === "snack") {
    push({
      title: `Lanche equilibrado (${ctx.label})`,
      prepMinutes: 8,
      summary: ctx.hint,
      steps: [
        "Distribua os alimentos em um prato ou pote para controle visual da porção.",
        `Combine exatamente o que o plano indica: ${ing}.`,
        "Beba água junto. Evite distrações para perceber saciedade.",
      ],
    });
  }

  // Genérico inteligente
  if (out.length === 0) {
    push({
      title: `Montagem sugerida para o ${ctx.label}`,
      prepMinutes: 20,
      summary: ctx.hint,
      steps: [
        "Separe mentalmente: fonte de proteína, carboidrato, vegetais/frutas e gorduras boas (conforme os nomes no plano).",
        `Ingredientes e porções: ${ing || "itens da refeição"}.`,
        "Cozinhe o que estiver cru; reaqueça gentilmente itens já descritos como cozidos/grelhados.",
        "Monte o prato com bastante cor: metade veg + um quarto proteína + um quarto carboidrato é um bom guia visual.",
      ],
    });
  }

  // Segunda variação quando há poucas sugestões específicas
  if (out.length === 1 && arr.length >= 2 && mealType !== "snack") {
    push({
      title: "Versão em bowl (tigela)",
      prepMinutes: 15,
      summary: "Mesmos alimentos, formato prático para trabalho ou estudo.",
      steps: [
        "Corte em cubos o que combinar (proteína já cozida, frutas, vegetais firmes).",
        "Na tigela: base de folhas ou carboidrato, camadas de proteína e topo com fruta/veg.",
        `Tudo que entra: ${ing}.`,
      ],
    });
  }

  return out.slice(0, 3);
}
