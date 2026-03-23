// Types and enums — unchanged
export enum Priority {
  URGENTE = "URGENTE",
  ATENCAO = "ATENCAO",
  NORMAL = "NORMAL",
  COMPRADO = "COMPRADO",
}

export enum Category {
  ALIMENTACAO = "🍽️ Alimentação",
  LIMPEZA = "🧹 Limpeza",
  HIGIENE = "🧴 Higiene",
  FRIOS = "🥶 Frios e Laticínios",
  PADARIA = "🍞 Padaria",
  HORTIFRUTI = "🍎 Hortifruti",
  OUTROS = "➕ Outros",
}

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  market?: string;
  items?: string[];
  category?: Category;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  priority: Priority;
  category: Category;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  updatedList?: ShoppingItem[];
  financialData?: {
    monthlyExpenses: { month: string; markets: { [market: string]: number } }[];
    categoryBreakdown: { category: string; amount: number }[];
  };
}

// processMessage agora chama /api/chat (Vercel Function) em vez do Gemini direto.
// A API key fica no servidor — nunca exposta no navegador.
export async function processMessage(
  message: string,
  currentList: ShoppingItem[],
  transactionHistory: Transaction[]
): Promise<{
  confirmation: string;
  updatedList: ShoppingItem[];
  newTransaction?: Partial<Transaction> | null;
  showFinancialSummary: boolean;
  financialData?: any;
}> {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, currentList, transactionHistory }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();

    return {
      confirmation: result.confirmation || "Entendido! Atualizei sua lista.",
      updatedList: result.updatedList || currentList,
      showFinancialSummary: !!result.showFinancialSummary,
      financialData: result.financialData || null,
      newTransaction: result.newTransaction || null,
    };
  } catch (error) {
    console.error("Error calling /api/chat:", error);
    return {
      confirmation: "Ops, tive um probleminha técnico aqui. Pode repetir a mensagem?",
      updatedList: currentList,
      showFinancialSummary: false,
      financialData: null,
      newTransaction: null,
    };
  }
}
