/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Send, ShoppingCart, Trash2, CheckCircle2, AlertCircle, Clock, Package, MoreHorizontal, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
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

const FinancialDashboard = React.memo(({ data }: { data: NonNullable<ChatMessage['financialData']> }) => {
  if (!data || !data.monthlyExpenses) {
    return (
      <div className="mt-4 p-4 bg-white rounded-xl border border-gray-100 text-center text-gray-500 text-xs italic">
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
    <div className="mt-4 space-y-6 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Current Month Summary */}
      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Gasto Total {currentMonthName}</p>
          <h4 className="text-2xl font-black text-blue-900">R$ {currentMonthTotal.toFixed(2)}</h4>
        </div>
        <div className="bg-white p-2 rounded-lg shadow-sm">
          <TrendingUp className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            Gastos por Estabelecimento (Valor)
          </h3>
          <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full uppercase tracking-wider">
            Total Acumulado
          </span>
        </div>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              layout="vertical" 
              data={marketRanking}
              margin={{ left: 20, right: 40, top: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="market" 
                type="category" 
                fontSize={10} 
                width={100}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b' }}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {marketRanking.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <LabelList dataKey="total" position="right" fontSize={10} formatter={(v: any) => `R$${v.toFixed(2)}`} fill="#475569" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend (Small) */}
      <div className="pt-6 border-t border-gray-50 space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Tendência Mensal
        </h3>
        <div className="h-32 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => `R$${v}`} />
              <Bar dataKey="total" fill="#3B82F6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {data.categoryBreakdown && data.categoryBreakdown.length > 0 && (
        <div className="pt-6 border-t border-gray-50 space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-purple-600" />
            Gastos por Categoria (Valor)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                layout="vertical" 
                data={data.categoryBreakdown.sort((a, b) => b.amount - a.amount)}
                margin={{ left: 20, right: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="category" 
                  type="category" 
                  fontSize={10} 
                  width={100}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {data.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <LabelList dataKey="amount" position="right" fontSize={10} formatter={(v: any) => `R$${v.toFixed(2)}`} fill="#475569" />
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

    const renderCluster = (title: string, items: ShoppingItem[], icon: React.ReactNode, bgColor: string) => {
      if (items.length === 0) return null;
      
      const categories = Object.values(Category);

      return (
        <div className={`p-3 rounded-xl ${bgColor} border border-black/5 space-y-3`}>
          <h4 className="font-bold flex items-center gap-2 text-gray-800">
            {icon}
            {title} ({items.length})
          </h4>
          {categories.map((cat) => {
            const itemsInCat = items.filter((item) => item.category === cat);
            if (itemsInCat.length === 0) return null;

            return (
              <div key={cat} className="space-y-1">
                <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter opacity-70">{cat}</h5>
                <ul className="space-y-1">
                  {itemsInCat.map((item) => (
                    <li 
                      key={item.id} 
                      className={`flex items-center justify-between p-2 rounded-lg bg-white/60 border border-black/5 ${item.priority === Priority.COMPRADO ? 'opacity-80' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{getPriorityEmoji(item.priority)}</span>
                        <span className={`font-medium text-sm ${
                          item.priority === Priority.ATENCAO ? 'text-blue-700' : 
                          item.priority === Priority.COMPRADO ? 'text-green-700' : 
                          'text-red-700'
                        }`}>{item.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{item.quantity} {item.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div className="mt-4 space-y-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          🛒 Lista Atualizada
        </h3>
        
        {renderCluster("COMPRAR", toBuy, <AlertCircle className="w-4 h-4 text-red-600" />, "bg-red-50")}
        
        {showPurchased && renderCluster("TEM EM CASA", atHome, <CheckCircle2 className="w-4 h-4 text-green-600" />, "bg-green-50")}

        <button 
          onClick={() => setShowPurchased(!showPurchased)}
          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-2"
        >
          <MoreHorizontal className="w-3 h-3" />
          {showPurchased ? "Esconder itens em casa" : "Mostrar o que tem em casa"}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#E5DDD5] font-sans">
      {/* Header */}
      <header className="bg-[#075E54] text-white p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={resetApp}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            title="Reiniciar App"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-lg leading-tight">Assistente de Compras</h1>
            <p className="text-[10px] text-white/80">Sempre pronto para o mercado</p>
          </div>
        </div>
        {lastTripCost !== null && (
          <div className="bg-white/10 px-3 py-1 rounded-lg text-right">
            <p className="text-[10px] uppercase font-bold opacity-70">Último Gasto</p>
            <p className="font-mono font-bold">R$ {lastTripCost.toFixed(2)}</p>
          </div>
        )}
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl shadow-sm relative ${
                  msg.sender === "user"
                    ? "bg-[#DCF8C6] rounded-tr-none"
                    : "bg-white rounded-tl-none"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm text-gray-800">{msg.text}</p>
                
                {msg.updatedList && renderShoppingList(msg.updatedList)}
                {msg.financialData && <FinancialDashboard data={msg.financialData} />}

                <span className="text-[10px] text-gray-400 block text-right mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-gray-400 rounded-full" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-gray-400 rounded-full" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-gray-400 rounded-full" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-[#F0F0F0] p-3 flex items-center gap-2">
        <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1 bg-white p-3 rounded-full text-sm focus:outline-none shadow-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`p-3 rounded-full transition-colors ${
              !inputValue.trim() || isLoading ? "bg-gray-300" : "bg-[#075E54] hover:bg-[#128C7E]"
            } text-white`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </footer>
    </div>
  );
}
