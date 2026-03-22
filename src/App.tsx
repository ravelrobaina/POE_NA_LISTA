/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Send, ShoppingCart, Trash2, CheckCircle2, AlertCircle, Clock, Package, MoreHorizontal, TrendingUp, PieChart as PieChartIcon, User, ChevronLeft, Paperclip, Smile, Mic, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LabelList,
  ComposedChart,
  Line
} from "recharts";
import { 
  Priority, 
  Category, 
  ShoppingItem, 
  ChatMessage, 
  Transaction,
  processMessage 
} from "./services/geminiService";

const INITIAL_LIST: ShoppingItem[] = [
  { id: "1", name: "Arroz", quantity: 2, unit: "kg", priority: Priority.URGENTE, category: Category.ALIMENTACAO },
  { id: "2", name: "Feijão", quantity: 1, unit: "kg", priority: Priority.URGENTE, category: Category.ALIMENTACAO },
  { id: "3", name: "Azeite", quantity: 1, unit: "un", priority: Priority.ATENCAO, category: Category.ALIMENTACAO },
  { id: "4", name: "Açúcar", quantity: 1, unit: "kg", priority: Priority.ATENCAO, category: Category.ALIMENTACAO },
  { id: "5", name: "Café", quantity: 500, unit: "g", priority: Priority.ATENCAO, category: Category.ALIMENTACAO },
  { id: "6", name: "Sal", quantity: 1, unit: "un", priority: Priority.NORMAL, category: Category.ALIMENTACAO },
  { id: "7", name: "Macarrão", quantity: 500, unit: "g", priority: Priority.NORMAL, category: Category.ALIMENTACAO },
  { id: "8", name: "Molho de tomate", quantity: 2, unit: "un", priority: Priority.NORMAL, category: Category.ALIMENTACAO },
  { id: "9", name: "Detergente", quantity: 1, unit: "un", priority: Priority.URGENTE, category: Category.LIMPEZA },
  { id: "10", name: "Sabão em pó", quantity: 1, unit: "un", priority: Priority.NORMAL, category: Category.LIMPEZA },
  { id: "11", name: "Amaciante", quantity: 1, unit: "un", priority: Priority.NORMAL, category: Category.LIMPEZA },
  { id: "12", name: "Papel higiênico", quantity: 1, unit: "pacote", priority: Priority.URGENTE, category: Category.HIGIENE },
  { id: "13", name: "Leite", quantity: 6, unit: "un", priority: Priority.URGENTE, category: Category.FRIOS },
  { id: "14", name: "Ovos", quantity: 1, unit: "dúzia", priority: Priority.URGENTE, category: Category.FRIOS },
  { id: "15", name: "Pão de forma", quantity: 1, unit: "un", priority: Priority.ATENCAO, category: Category.PADARIA },
  { id: "16", name: "Toddy ou achocolatado", quantity: 1, unit: "un", priority: Priority.NORMAL, category: Category.ALIMENTACAO },
  { id: "17", name: "Shampoo", quantity: 1, unit: "un", priority: Priority.NORMAL, category: Category.HIGIENE },
  { id: "18", name: "Sabonete", quantity: 3, unit: "un", priority: Priority.NORMAL, category: Category.HIGIENE },
  { id: "19", name: "Maçã", quantity: 1, unit: "kg", priority: Priority.NORMAL, category: Category.HORTIFRUTI },
  { id: "20", name: "Banana", quantity: 1, unit: "dúzia", priority: Priority.NORMAL, category: Category.HORTIFRUTI },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const MONTHS_ORDER = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

enum Tab {
  CHAT = "CHAT",
  REPORT = "REPORT"
}

const FinancialDashboard = React.memo(({ data }: { data: NonNullable<ChatMessage['financialData']> }) => {
  if (!data || !data.monthlyExpenses) {
    return (
      <div className="mt-2 p-3 bg-white rounded-xl border border-gray-100 text-center text-gray-500 text-[10px] italic">
        Aguardando dados financeiros...
      </div>
    );
  }

  const currentMonthName = MONTHS_ORDER[new Date().getMonth()];
  const currentMonthData = data.monthlyExpenses.find(m => m.month === currentMonthName);
  const currentMonthTotal = currentMonthData ? Object.values(currentMonthData.markets).reduce((a, b) => a + b, 0) : 0;

  // Ensure all 12 months are represented
  const barData = MONTHS_ORDER.map(monthName => {
    const monthData = data.monthlyExpenses.find(m => m.month === monthName);
    const markets = monthData?.markets || {};
    const total = Object.values(markets).reduce((a, b) => a + (Number(b) || 0), 0);
    
    return {
      name: monthName,
      ...markets,
      total: total > 0 ? total : undefined
    };
  });

  const allMarkets = Array.from(new Set(data.monthlyExpenses.flatMap(m => m.markets ? Object.keys(m.markets) : [])));
  
  // Market ranking for current month or all time
  const marketRanking = allMarkets.map(market => {
    const total = data.monthlyExpenses.reduce((acc, m) => acc + (m.markets[market] || 0), 0);
    return { market, total };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="mt-2 space-y-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Current Month Summary */}
      <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Total {currentMonthName}</p>
          <h4 className="text-xl font-black text-emerald-900">R$ {currentMonthTotal.toFixed(2)}</h4>
        </div>
        <div className="bg-white p-1.5 rounded-md shadow-sm">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-700 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-emerald-600" />
          Gastos por Local
        </h3>
        
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              layout="vertical" 
              data={marketRanking}
              margin={{ left: 0, right: 35, top: 5, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis 
                dataKey="market" 
                type="category" 
                fontSize={9} 
                width={70}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b' }}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '10px' }}
                formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {marketRanking.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <LabelList dataKey="total" position="right" fontSize={9} formatter={(v: any) => `R$${v.toFixed(2)}`} fill="#475569" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {data.categoryBreakdown && data.categoryBreakdown.length > 0 && (
        <div className="pt-4 border-t border-gray-50 space-y-3">
          <h3 className="text-xs font-bold text-gray-700 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-purple-600" />
            Por Categoria
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                layout="vertical" 
                data={data.categoryBreakdown.sort((a, b) => b.amount - a.amount)}
                margin={{ left: 0, right: 35 }}
              >
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="category" 
                  type="category" 
                  fontSize={9} 
                  width={70}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {data.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <LabelList dataKey="amount" position="right" fontSize={9} formatter={(v: any) => `R$${v.toFixed(2)}`} fill="#475569" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
});

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHAT);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(INITIAL_LIST);
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);
  const [lastTripCost, setLastTripCost] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPurchased, setShowPurchased] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // First message
    const welcomeMessage: ChatMessage = {
      id: "welcome",
      text: "Oi! 👋 Sou seu assistente de compras financeiro.\nMe avisa quando algo acabar ou quando for ao mercado!\n\nAgora posso te mostrar gráficos de gastos mensais e por categoria. É só perguntar: 'Quanto gastei no mês?' 😄",
      sender: "bot",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const resetApp = () => {
    setMessages([{
      id: "welcome",
      text: "Oi! 👋 Sou seu assistente de compras financeiro.\nMe avisa quando algo acabar ou quando for ao mercado!\n\nAgora posso te mostrar gráficos de gastos mensais e por categoria. É só perguntar: 'Quanto gastei no mês?' 😄",
      sender: "bot",
      timestamp: new Date(),
    }]);
    setShoppingList(INITIAL_LIST);
    setTransactionHistory([]);
    setLastTripCost(null);
    setInputValue("");
  };

  const resetMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Remove transactions from current month
    setTransactionHistory(prev => prev.filter(tx => {
      const txDate = new Date(tx.date);
      // If date is invalid or from current month/year, filter it out
      if (isNaN(txDate.getTime())) return true;
      return txDate.getMonth() !== currentMonth || txDate.getFullYear() !== currentYear;
    }));

    // Reset list to initial (since we don't track monthly snapshots yet)
    setShoppingList(INITIAL_LIST);
    setLastTripCost(null);

    const botMsg: ChatMessage = {
      id: generateId(),
      text: "Mês reiniciado! 🔄\nZerei os gastos deste mês e restaurei sua lista de compras padrão.",
      sender: "bot",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, botMsg]);
  };

  const calculateFinancialData = useCallback((history: Transaction[]) => {
    const monthlyExpensesMap: { [month: string]: { [market: string]: number } } = {};
    const categoryMap: { [category: string]: number } = {};

    history.forEach(tx => {
      const date = new Date(tx.date);
      const month = MONTHS_ORDER[date.getMonth()];
      
      if (!monthlyExpensesMap[month]) monthlyExpensesMap[month] = {};
      const market = tx.market || "Outros";
      monthlyExpensesMap[month][market] = (monthlyExpensesMap[month][market] || 0) + tx.amount;

      // Prioritize transaction category if available
      if (tx.category) {
        categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount;
      } else if (tx.items && tx.items.length > 0) {
        // Fallback to item-based categorization
        tx.items.forEach(itemName => {
          const listItem = shoppingList.find(i => i.name.toLowerCase() === itemName.toLowerCase());
          const cat = listItem?.category || Category.OUTROS;
          categoryMap[cat] = (categoryMap[cat] || 0) + (tx.amount / tx.items!.length);
        });
      } else {
        categoryMap[Category.OUTROS] = (categoryMap[Category.OUTROS] || 0) + tx.amount;
      }
    });

    const monthlyExpenses = Object.entries(monthlyExpensesMap).map(([month, markets]) => ({
      month,
      markets
    }));

    monthlyExpenses.sort((a, b) => MONTHS_ORDER.indexOf(a.month) - MONTHS_ORDER.indexOf(b.month));

    const categoryBreakdown = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount
    }));

    return { monthlyExpenses, categoryBreakdown };
  }, [shoppingList]);

  const annualData = useMemo(() => calculateFinancialData(transactionHistory), [transactionHistory, calculateFinancialData]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Special local commands
    const lowerText = inputValue.toLowerCase();
    if (lowerText.includes("o que já comprei") || lowerText.includes("mostra os comprados")) {
      setShowPurchased(true);
      const botMsg: ChatMessage = {
        id: generateId(),
        text: "Aqui estão os itens que você já tem em casa! ✅",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    if (lowerText.includes("esconder comprados") || lowerText.includes("ocultar comprados")) {
      setShowPurchased(false);
      const botMsg: ChatMessage = {
        id: generateId(),
        text: "Beleza, ocultei os itens que você já tem. 👍",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    if (lowerText.includes("o que falta") || lowerText.includes("lista de compras") || lowerText === "lista") {
      const botMsg: ChatMessage = {
        id: generateId(),
        text: "Aqui está o que você ainda precisa comprar! 🛒",
        sender: "bot",
        timestamp: new Date(),
        updatedList: shoppingList,
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    setIsLoading(true);

    const maxRetries = 1;
    let attempt = 0;
    let success = false;

    while (attempt <= maxRetries && !success) {
      try {
        // Add a timeout protection of 90 seconds
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 90000)
        );

        const result = await Promise.race([
          processMessage(inputValue, shoppingList, transactionHistory),
          timeoutPromise
        ]) as any;

        success = true;

        // Ensure financial data is correctly structured if present
        if (result.showFinancialSummary || result.newTransaction) {
          // ALWAYS use local calculation for the dashboard to ensure 100% accuracy with history
          const localData = calculateFinancialData([...transactionHistory, ...(result.newTransaction ? [{
            id: "temp",
            amount: result.newTransaction.amount!,
            market: result.newTransaction.market || undefined,
            items: result.newTransaction.items || undefined,
            category: result.newTransaction.category || undefined,
            date: new Date().toISOString().split('T')[0]
          }] : [])]);

          result.financialData = {
            monthlyExpenses: localData.monthlyExpenses,
            categoryBreakdown: localData.categoryBreakdown
          };
        }
        
        if (result.newTransaction) {
          const newTx: Transaction = {
            id: generateId(),
            amount: result.newTransaction.amount!,
            market: result.newTransaction.market || undefined,
            items: result.newTransaction.items || undefined,
            category: result.newTransaction.category || undefined,
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
          };
          setTransactionHistory(prev => [...prev, newTx]);
          setLastTripCost(newTx.amount);
        }

        const botMessage: ChatMessage = {
          id: generateId(),
          text: result.confirmation,
          sender: "bot",
          timestamp: new Date(),
          updatedList: result.showFinancialSummary ? undefined : (result.updatedList && result.updatedList.length > 0 ? result.updatedList : shoppingList),
          financialData: result.showFinancialSummary ? result.financialData : undefined,
        };

        if (result.updatedList && result.updatedList.length > 0) {
          setShoppingList(prev => {
            const newList = [...prev];
            result.updatedList.forEach((updatedItem: ShoppingItem) => {
              const index = newList.findIndex(i => i.id === updatedItem.id);
              if (index > -1) {
                newList[index] = updatedItem;
              } else {
                newList.push(updatedItem);
              }
            });
            return newList;
          });
        }
        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        console.error(`Error in handleSendMessage (attempt ${attempt + 1}):`, error);
        attempt++;
        
        if (attempt > maxRetries) {
          const isTimeout = error instanceof Error && error.message === "Timeout";
          const errorMessage: ChatMessage = {
            id: generateId(),
            text: isTimeout 
              ? "A resposta está demorando um pouco mais que o normal devido ao volume de dados. Pode tentar enviar novamente? 😅"
              : "Ops, tive um problema técnico ao processar sua mensagem. Pode tentar de novo?",
            sender: "bot",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      }
    }
    setIsLoading(false);
  };

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENTE: return <AlertCircle className="w-4 h-4 text-red-500" />;
      case Priority.ATENCAO: return <Clock className="w-4 h-4 text-blue-500" />;
      case Priority.NORMAL: return <Package className="w-4 h-4 text-red-500" />;
      case Priority.COMPRADO: return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
  };

  const getPriorityEmoji = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENTE: return "🔴";
      case Priority.ATENCAO: return "🔵";
      case Priority.NORMAL: return "🔴";
      case Priority.COMPRADO: return "🟢";
    }
  };

  const renderShoppingList = (list: ShoppingItem[] | undefined) => {
    if (!list || !Array.isArray(list)) return null;
    const toBuy = list.filter(item => item.priority !== Priority.COMPRADO);
    const atHome = list.filter(item => item.priority === Priority.COMPRADO);

    const renderCluster = (title: string, items: ShoppingItem[], icon: React.ReactNode, bgColor: string, textColor: string) => {
      if (items.length === 0) return null;
      
      const categories = Object.values(Category);

      return (
        <div className={`p-2 rounded-xl ${bgColor} border border-black/5 space-y-2`}>
          <h4 className={`text-xs font-bold flex items-center gap-2 ${textColor}`}>
            {icon}
            {title} ({items.length})
          </h4>
          {categories.map((cat) => {
            const itemsInCat = items.filter((item) => item.category === cat);
            if (itemsInCat.length === 0) return null;

            return (
              <div key={cat} className="space-y-1">
                <h5 className="text-[9px] font-bold text-gray-400 uppercase tracking-tight pl-1">{cat}</h5>
                <div className="space-y-1">
                  {itemsInCat.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-1.5 rounded-lg bg-white/80 border border-black/5"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-xs flex-shrink-0">{getPriorityEmoji(item.priority)}</span>
                        <span className="text-xs font-medium text-gray-700 truncate">{item.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 flex-shrink-0 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {item.quantity}{item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div className="mt-2 space-y-3">
        {renderCluster("PRECISA COMPRAR", toBuy, <AlertCircle className="w-3 h-3" />, "bg-red-50/50", "text-red-700")}
        {showPurchased && renderCluster("JÁ TEM EM CASA", atHome, <CheckCircle2 className="w-3 h-3" />, "bg-emerald-50/50", "text-emerald-700")}

        <button 
          onClick={() => setShowPurchased(!showPurchased)}
          className="w-full py-2 text-[10px] font-bold text-blue-600 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-center gap-1"
        >
          <MoreHorizontal className="w-3 h-3" />
          {showPurchased ? "OCULTAR COMPRADOS" : "VER ITENS EM CASA"}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#e5ddd5] font-sans overflow-hidden">
      {/* WhatsApp Header */}
      <header className="bg-[#075e54] text-white px-3 py-2 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-2">
          <ChevronLeft className="w-6 h-6" />
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-white/20">
              <ShoppingCart className="w-6 h-6 text-[#075e54]" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#075e54] rounded-full"></div>
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-sm leading-tight">Lista de Compras</h1>
            <p className="text-[10px] text-white/80">
              {isLoading ? "digitando..." : "online"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={resetMonth} 
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors flex flex-col items-center"
            title="Reiniciar Mês"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase mt-0.5">Mês</span>
          </button>
          <button 
            onClick={resetApp} 
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors flex flex-col items-center"
            title="Reiniciar App"
          >
            <Trash2 className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase mt-0.5">Tudo</span>
          </button>
          <MoreHorizontal className="w-5 h-5" />
        </div>
      </header>

      {/* WhatsApp Tabs */}
      <div className="flex bg-[#075e54] text-white/60 font-bold text-[11px] uppercase tracking-wider shadow-md z-10">
        <button 
          onClick={() => setActiveTab(Tab.CHAT)}
          className={`flex-1 py-3 border-b-2 transition-all duration-200 ${activeTab === Tab.CHAT ? 'border-white text-white' : 'border-transparent hover:text-white/80'}`}
        >
          Conversas
        </button>
        <button 
          onClick={() => setActiveTab(Tab.REPORT)}
          className={`flex-1 py-3 border-b-2 transition-all duration-200 ${activeTab === Tab.REPORT ? 'border-white text-white' : 'border-transparent hover:text-white/80'}`}
        >
          Relatório Anual
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {activeTab === Tab.CHAT ? (
          <>
            {/* Chat Area - WhatsApp Background Pattern */}
            <main 
              className="flex-1 overflow-y-auto p-3 space-y-2 relative"
              style={{ 
                backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
                backgroundSize: '400px',
                backgroundRepeat: 'repeat'
              }}
            >
              <div className="flex justify-center mb-4">
                <span className="bg-[#d1e9f9] text-[10px] text-gray-600 px-3 py-1 rounded-lg shadow-sm uppercase font-bold tracking-wider">
                  Hoje
                </span>
              </div>

              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] p-2 px-3 rounded-lg shadow-sm relative min-w-[60px] ${
                        msg.sender === "user"
                          ? "bg-[#dcf8c6] rounded-tr-none ml-12"
                          : "bg-white rounded-tl-none mr-12"
                      }`}
                    >
                      {/* Bubble Tail */}
                      <div className={`absolute top-0 w-3 h-3 ${
                        msg.sender === "user" 
                          ? "right-[-8px] bg-[#dcf8c6]" 
                          : "left-[-8px] bg-white"
                      }`} 
                      style={{ 
                        clipPath: msg.sender === "user" 
                          ? 'polygon(0 0, 0 100%, 100% 0)' 
                          : 'polygon(100% 0, 100% 100%, 0 0)' 
                      }} />

                      <p className="whitespace-pre-wrap text-[13px] text-gray-800 leading-relaxed">{msg.text}</p>
                      
                      {msg.updatedList && renderShoppingList(msg.updatedList)}
                      {msg.financialData && <FinancialDashboard data={msg.financialData} />}

                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[9px] text-gray-400">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.sender === "user" && (
                          <div className="flex">
                            <CheckCircle2 className="w-2.5 h-2.5 text-blue-400" />
                            <CheckCircle2 className="w-2.5 h-2.5 text-blue-400 -ml-1" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-2 px-4 rounded-lg rounded-tl-none shadow-sm flex gap-1 items-center">
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </main>

            {/* WhatsApp Input Area */}
            <footer className="bg-[#f0f0f0] p-2 flex items-center gap-2 pb-safe">
              <div className="flex-1 bg-white rounded-full flex items-center px-3 py-1 shadow-sm border border-gray-200">
                <Smile className="w-6 h-6 text-gray-400 mr-2" />
                <form onSubmit={handleSendMessage} className="flex-1">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Mensagem"
                    className="w-full py-2 bg-transparent text-sm focus:outline-none"
                    disabled={isLoading}
                  />
                </form>
                <Paperclip className="w-6 h-6 text-gray-400 ml-2 -rotate-45" />
              </div>
              <button
                onClick={() => inputValue.trim() ? handleSendMessage() : null}
                disabled={isLoading}
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95 ${
                  !inputValue.trim() ? "bg-[#075e54]" : "bg-[#075e54]"
                } text-white`}
              >
                {inputValue.trim() ? (
                  <Send className="w-5 h-5 ml-0.5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            </footer>
          </>
        ) : (
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-gray-800">Relatório Anual {new Date().getFullYear()}</h2>
                  <p className="text-xs text-gray-500">Visão geral de todos os seus gastos</p>
                </div>
                <div className="bg-emerald-100 p-2 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>

              {/* Annual Summary Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Gasto</p>
                  <p className="text-lg font-black text-emerald-900">
                    R$ {annualData.monthlyExpenses.reduce((acc: number, m) => acc + (Object.values(m.markets) as number[]).reduce((a, b) => a + b, 0), 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Média Mensal</p>
                  <p className="text-lg font-black text-blue-900">
                    R$ {(annualData.monthlyExpenses.reduce((acc: number, m) => acc + (Object.values(m.markets) as number[]).reduce((a, b) => a + b, 0), 0) / (annualData.monthlyExpenses.length || 1)).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Monthly Trend Chart */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Evolução Mensal
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MONTHS_ORDER.map(m => {
                      const monthData = annualData.monthlyExpenses.find(ex => ex.month === m);
                      const total = monthData ? (Object.values(monthData.markets) as number[]).reduce((a, b) => a + b, 0) : 0;
                      return { name: m, total };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(v) => `R$ ${Number(v).toFixed(2)}`}
                      />
                      <Bar dataKey="total" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-6">
                <PieChartIcon className="w-4 h-4 text-purple-600" />
                Gastos por Categoria (Ano)
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    layout="vertical" 
                    data={annualData.categoryBreakdown.sort((a, b) => b.amount - a.amount)}
                    margin={{ left: 0, right: 40 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="category" 
                      type="category" 
                      fontSize={10} 
                      width={80}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(v) => `R$ ${Number(v).toFixed(2)}`}
                    />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                      {annualData.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                      <LabelList dataKey="amount" position="right" fontSize={10} formatter={(v: any) => `R$${v.toFixed(2)}`} fill="#475569" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
