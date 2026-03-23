import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `Assistente de compras sênior e analista financeiro.
OBJETIVO: Gerenciar lista de compras e controle financeiro mensal com precisão de QA.

REGRAS DE EXTRAÇÃO (QA):
1. ADICIONAR ITENS: Identifique intenção de adicionar à lista ("precisa comprar", "acabou", "falta", "comprar", "põe na lista").
2. REGISTRAR COMPRA: Identifique gastos ("gastei", "comprei", "pagamos", "foi R$").
3. LOCAL: Identifique o estabelecimento (ex: "Carrefour", "Padaria").
4. VALOR: Extraia o valor exato (ex: "12,50" -> 12.5).
5. ITENS: Liste os itens. Se "comprei tudo", marque pendentes como COMPRADO.
6. CATEGORIA: Atribua categoria baseada no local ou itens.

EXEMPLOS DE QA:
- "Acabou o leite e o pão" -> updatedList: [{name: "Leite", priority: "URGENTE", ...}, {name: "Pão", priority: "URGENTE", ...}].
- "Precisa comprar sabão em pó" -> updatedList: [{name: "Sabão em pó", priority: "URGENTE", ...}].
- "Falta detergente" -> updatedList: [{name: "Detergente", priority: "URGENTE", ...}].
- "Gastei 45 no açougue com picanha" -> Valor: 45.0, Local: Açougue, Itens: ["Picanha"], Categoria: ALIMENTACAO.
- "Comprei a lista toda no Extra por 200" -> Valor: 200.0, Local: Extra, updatedList: [todos como COMPRADO].

REGRAS DE LISTA:
1. Estados: URGENTE/NORMAL (Vermelho), ATENCAO (Azul), COMPRADO (Verde).
2. DELTA: Retorne em 'updatedList' APENAS os itens que foram criados ou modificados.
3. Se o usuário disser "acabou o leite", adicione ou atualize "Leite" para URGENTE.

REGRAS FINANCEIRAS:
1. 'showFinancialSummary' deve ser TRUE apenas para pedidos de resumo, totais ou gráficos.
2. 'financialData' deve agregar TODO o histórico fornecido em 'H'.

TOM: Profissional, preciso e amigável (PT-BR).`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    confirmation: { type: Type.STRING },
    showFinancialSummary: { type: Type.BOOLEAN },
    financialData: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        monthlyExpenses: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              month: { type: Type.STRING },
              markets: { type: Type.OBJECT, additionalProperties: { type: Type.NUMBER } },
            },
            required: ["month", "markets"],
          },
        },
        categoryBreakdown: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { category: { type: Type.STRING }, amount: { type: Type.NUMBER } },
            required: ["category", "amount"],
          },
        },
      },
    },
    newTransaction: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        amount: { type: Type.NUMBER },
        market: { type: Type.STRING, nullable: true },
        items: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
        category: { type: Type.STRING, nullable: true },
      },
      required: ["amount"],
    },
    updatedList: {
      type: Type.ARRAY,
      description: "APENAS itens novos ou modificados.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unit: { type: Type.STRING },
          priority: { type: Type.STRING },
          category: { type: Type.STRING },
        },
        required: ["id", "name", "quantity", "unit", "priority", "category"],
      },
    },
  },
  required: ["confirmation", "updatedList", "showFinancialSummary"],
};

export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, currentList, transactionHistory } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    // API key stays on the server — never sent to the browser
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const model = "gemini-1.5-flash";

    const currentDate = new Date().toLocaleDateString("pt-BR");
    const isAskingForSummary = /(gasto|resumo|total|financeiro|relatório|estatística|gráfico|mercado|dinheiro|custou)/i.test(message) && !/falta|faltando/i.test(message);
    const limitedHistory = isAskingForSummary
      ? (transactionHistory || []).slice(-100)
      : (transactionHistory || []).slice(-10);

    const prompt = `
D: ${currentDate}
M: "${message}"
L: ${JSON.stringify((currentList || []).filter((i: any) => i.priority !== "COMPRADO").map((i: any) => ({ id: i.id, n: i.name, p: i.priority })))}
H: ${JSON.stringify(limitedHistory)}

RETORNE DELTAS. SE O USUÁRIO PERGUNTAR "O QUE FALTA?", "LISTA" OU SIMILARES, 'showFinancialSummary: false' E 'updatedList: []'. O APP MOSTRARÁ A LISTA ATUAL.
`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    let responseText = response.text || "{}";
    responseText = responseText.replace(/```json\n?|```/g, "").trim();
    responseText = responseText.replace(/:\s*(\d+),(\d+)/g, ": $1.$2");

    const result = JSON.parse(responseText);

    return res.status(200).json({
      confirmation: result.confirmation || "Entendido! Atualizei sua lista.",
      updatedList: result.updatedList || [],
      showFinancialSummary: !!result.showFinancialSummary,
      financialData: result.financialData || null,
      newTransaction: result.newTransaction || null,
    });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({
      confirmation: "Ops, tive um probleminha técnico. Pode repetir?",
      updatedList: [],
      showFinancialSummary: false,
      financialData: null,
      newTransaction: null,
    });
  }
}
