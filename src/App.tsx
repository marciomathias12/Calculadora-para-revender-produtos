import React, { useState, useCallback, useMemo, useRef, memo, useEffect } from 'react';
import { Plus, Trash2, LayoutDashboard, Calculator, Receipt, RotateCcw, MessageSquare, Send, Bot, AlertTriangle, ShieldCheck, Diamond, ArrowRight, Info, PieChart, TrendingUp, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { ProductItem, AnalysisResult, CalculatedItem, ChatMessage, User } from '../types';
import { COLORS, DEFAULT_EXCHANGE_RATE } from '../constants';
import { getStrategicAnalysis } from '../services/geminiService';
import { supabase } from './supabaseClient';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { ConfigError } from './components/ConfigError';

// Componente de Linha de Input Memoizado
const ItemRow = memo(({ 
  item, 
  onUpdate, 
  onRemove 
}: { 
  item: ProductItem; 
  onUpdate: (id: string, field: keyof ProductItem, value: string | number) => void;
  onRemove: (id: string) => void;
}) => {
  return (
    <div className="grid grid-cols-12 gap-4 pb-8 border-b border-black/5 last:border-0 last:pb-0 animate-in fade-in slide-in-from-left-2 duration-300">
      <div className="col-span-12 md:col-span-5">
        <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-2 block">Item / Modelo</label>
        <input
          type="text"
          placeholder="Ex: Polo Ralph Lauren"
          className="w-full bg-zinc-50 border-none px-4 py-3 text-sm font-medium focus:ring-2 ring-black/5 transition-all rounded-xl"
          value={item.name}
          onChange={(e) => onUpdate(item.id, 'name', e.target.value)}
        />
      </div>
      <div className="col-span-6 md:col-span-3">
        <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-2 block">Preço Unit. (¥)</label>
        <input
          type="number"
          placeholder="0"
          className="w-full bg-zinc-50 border-none px-4 py-3 text-sm font-mono focus:ring-2 ring-black/5 rounded-xl"
          value={item.priceYuan || ''}
          onChange={(e) => onUpdate(item.id, 'priceYuan', Number(e.target.value))}
        />
      </div>
      <div className="col-span-4 md:col-span-3">
        <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-2 block">Qtd.</label>
        <input
          type="number"
          placeholder="1"
          className="w-full bg-zinc-50 border-none px-4 py-3 text-sm font-mono focus:ring-2 ring-black/5 rounded-xl text-center"
          value={item.quantity || ''}
          onChange={(e) => onUpdate(item.id, 'quantity', Number(e.target.value))}
        />
      </div>
      <div className="col-span-2 md:col-span-1 flex items-end justify-center">
        <button 
          onClick={() => onRemove(item.id)}
          className="text-zinc-300 hover:text-red transition-all p-2 hover:bg-red/5 rounded-full mb-1"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
});

ItemRow.displayName = 'ItemRow';

// Componente de Linha de Resultado Memoizado para Alta Performance
const ResultItemRow = memo(({ item, rate }: { item: CalculatedItem; rate: number }) => {
  return (
    <tr className="border-b border-black/5 last:border-0 hover:bg-zinc-50/30 transition-all group">
      <td className="px-8 py-6">
        <p className="font-bold uppercase tracking-tight text-zinc-700 group-hover:text-black transition-colors">
          {item.name || 'Sem Identificação'}
        </p>
        <p className="text-[10px] text-zinc-300 font-mono">Lote: {item.quantity} un.</p>
      </td>
      <td className="px-8 py-6">
        <p className="font-black font-mono text-black">R$ {item.totalCostBRL.toFixed(0)}</p>
        <p className="text-[9px] text-zinc-300 uppercase font-bold tracking-tighter">Base: R$ {(item.priceYuan * rate).toFixed(0)}</p>
      </td>
      <td className="px-8 py-6">
        <p className="font-black font-mono text-zinc-400">R$ {item.suggestedPriceBRL.toFixed(0)}</p>
        <p className="text-[9px] text-zinc-300 uppercase font-bold">Sugestão Yuanware</p>
      </td>
      <td className="px-8 py-6">
        <p className="font-black font-mono text-red">R$ {item.profitBRL.toFixed(0)}</p>
        <p className="text-[9px] text-zinc-300 uppercase font-bold">Spread Est.</p>
      </td>
    </tr>
  );
});

ResultItemRow.displayName = 'ResultItemRow';

const CostCompositionChart = memo(({ product, freight, tax, total }: { product: number, freight: number, tax: number, total: number }) => {
  const pPerc = total > 0 ? (product / total) * 100 : 0;
  const fPerc = total > 0 ? (freight / total) * 100 : 0;
  const tPerc = total > 0 ? (tax / total) * 100 : 0;

  return (
    <div className="bg-white rounded-[2.5rem] p-10 luxury-shadow border border-black/5 flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-10">
        <h4 className="text-[11px] font-black tracking-[0.3em] uppercase text-zinc-400 flex items-center gap-3">
          <PieChart size={16} /> Composição do Gasto
        </h4>
      </div>
      
      <div className="relative w-48 h-48 mb-10">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle
            cx="18" cy="18" r="15.915"
            fill="transparent" stroke="#111" strokeWidth="4"
            strokeDasharray={`${pPerc} ${100 - pPerc}`}
            strokeDashoffset="25"
          />
          <circle
            cx="18" cy="18" r="15.915"
            fill="transparent" stroke="#71717a" strokeWidth="4"
            strokeDasharray={`${fPerc} ${100 - fPerc}`}
            strokeDashoffset={`${125 - pPerc}`}
          />
          <circle
            cx="18" cy="18" r="15.915"
            fill="transparent" stroke="#D0021B" strokeWidth="4"
            strokeDasharray={`${tPerc} ${100 - tPerc}`}
            strokeDashoffset={`${125 - pPerc - fPerc}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-300">Total</span>
          <span className="text-xl font-black font-mono">100%</span>
        </div>
      </div>

      <div className="w-full space-y-4">
        {[
          { color: 'bg-black', label: 'Produtos', val: pPerc },
          { color: 'bg-zinc-400', label: 'Logística', val: fPerc },
          { color: 'bg-red', label: 'Tributos', val: tPerc }
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
              <span className="text-[10px] uppercase font-bold text-zinc-400">{item.label}</span>
            </div>
            <span className="text-xs font-mono font-bold">{item.val.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
});

CostCompositionChart.displayName = 'CostCompositionChart';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [view, setView] = useState<'auth' | 'dashboard' | 'calculator'>('auth');

  // Auth State Listener
  useEffect(() => {
    if (!supabase) {
      setAuthChecking(false);
      return;
    }

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email });
          setView('dashboard');
        }
      } catch (e) {
        console.error('Erro ao verificar sessão:', e);
      } finally {
        setAuthChecking(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        setView('dashboard');
      } else {
        setUser(null);
        setView('auth');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Calculator States
  const [items, setItems] = useState<ProductItem[]>([{ id: '1', name: '', priceYuan: 0, quantity: 1 }]);
  const [freight, setFreight] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [rate, setRate] = useState<number>(DEFAULT_EXCHANGE_RATE);
  const [markup, setMarkup] = useState<number>(2.0);
  const [distributionMode, setDistributionMode] = useState<'proportional' | 'equal'>('proportional');
  
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const ticketRef = useRef<HTMLDivElement>(null);

  // Verificação de Conexão e Tabelas
  useEffect(() => {
    const verifyConnection = async () => {
      if (!supabase) return;
      try {
        // Tenta buscar um registro da tabela calculations para validar existência e RLS
        const { error } = await supabase.from('calculations').select('id').limit(1);
        if (error) {
          console.error('Erro de conexão/tabela:', error.message);
          // Se o erro for "relation does not exist", as tabelas não foram criadas
          if (error.code === '42P01') {
            console.error('Tabelas não encontradas no Supabase.');
          }
        } else {
          console.log('Conexão com Supabase e tabelas verificada com sucesso.');
        }
      } catch (e) {
        console.error('Falha crítica na verificação do Supabase:', e);
      }
    };
    verifyConnection();
  }, []);

  const saveCalculation = async () => {
    if (!analysis || !user || !supabase) return;
    
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // 1. Salvar o cabeçalho do cálculo
      const { data: calcData, error: calcError } = await supabase
        .from('calculations')
        .insert({
          user_id: user.id,
          name: `Lote ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
          total_investment_brl: analysis.totalInvestmentBRL,
          total_revenue_brl: analysis.totalRevenueBRL,
          total_profit_brl: analysis.totalProfitBRL,
          roi: analysis.roi,
          verdict: analysis.verdict,
          freight_yuan: freight,
          tax_brl: tax,
          exchange_rate: rate,
          markup: markup,
          distribution_mode: distributionMode
        })
        .select()
        .single();

      if (calcError) throw calcError;

      // 2. Salvar os itens do cálculo
      const itemsToInsert = analysis.items.map(item => ({
        calculation_id: calcData.id,
        name: item.name,
        price_yuan: item.priceYuan,
        quantity: item.quantity,
        total_cost_brl: item.totalCostBRL,
        suggested_price_brl: item.suggestedPriceBRL,
        profit_brl: item.profitBRL,
        distributed_freight_brl: item.distributedFreightBRL,
        distributed_tax_brl: item.distributedTaxBRL
      }));

      const { error: itemsError } = await supabase
        .from('calculation_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // 3. Salvar histórico de chat se houver
      if (chatHistory.length > 0) {
        const messagesToInsert = chatHistory.map(msg => ({
          calculation_id: calcData.id,
          role: msg.role,
          content: msg.content
        }));

        await supabase.from('chat_messages').insert(messagesToInsert);
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Erro ao salvar cálculo:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = useCallback(() => {
    setItems(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: '', priceYuan: 0, quantity: 1 }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev);
  }, []);

  const updateItem = useCallback((id: string, field: keyof ProductItem, value: string | number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }, []);

  const processRounding = (price: number): number => {
    const ceilVal = Math.ceil(price);
    const lastDigit = ceilVal % 10;
    if (lastDigit === 0) return ceilVal;
    if (lastDigit < 7) return Math.floor(ceilVal / 10) * 10 + 7;
    return Math.ceil(ceilVal / 10) * 10;
  };

  const processData = useCallback(() => {
    setLoading(true);
    
    setTimeout(() => {
      const totalItemsValueYuan = items.reduce((acc, item) => acc + (item.priceYuan * item.quantity), 0);
      const totalUnits = items.reduce((acc, item) => acc + item.quantity, 0);
      
      let totalInvestment = 0;
      let totalRevenue = 0;
      
      const calculatedItems: CalculatedItem[] = items.map(item => {
        const itemTotalYuan = item.priceYuan * item.quantity;
        let itemFreight = 0;
        let itemTax = 0;

        if (distributionMode === 'proportional') {
          const weight = totalItemsValueYuan > 0 ? itemTotalYuan / totalItemsValueYuan : 0;
          itemFreight = freight * weight;
          itemTax = tax * weight;
        } else {
          itemFreight = totalUnits > 0 ? (freight / totalUnits) * item.quantity : 0;
          itemTax = totalUnits > 0 ? (tax / totalUnits) * item.quantity : 0;
        }

        const totalCostBRL = (itemTotalYuan * rate) + (itemFreight * rate) + (itemTax * rate);
        const unitCostBRL = item.quantity > 0 ? totalCostBRL / item.quantity : 0;
        const suggestedPriceBRL = processRounding(unitCostBRL * markup);
        const totalRevenueItem = suggestedPriceBRL * item.quantity;
        const profitBRL = totalRevenueItem - totalCostBRL;

        totalInvestment += totalCostBRL;
        totalRevenue += totalRevenueItem;

        return {
          ...item,
          totalCostBRL,
          unitCostBRL,
          suggestedPriceBRL,
          profitBRL,
          distributedFreightBRL: (itemFreight * rate) / (item.quantity || 1),
          distributedTaxBRL: (itemTax * rate) / (item.quantity || 1)
        };
      });

      const totalProfit = totalRevenue - totalInvestment;
      const roi = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

      setAnalysis({
        items: calculatedItems,
        totalInvestmentBRL: totalInvestment,
        totalRevenueBRL: totalRevenue,
        totalProfitBRL: totalProfit,
        roi,
        verdict: roi > 100 ? 'GEM' : roi >= 50 ? 'HEALTHY' : 'RISKY'
      });
      setLoading(false);
    }, 800);
  }, [items, freight, tax, rate, markup, distributionMode]);

  const handleChat = async () => {
    if (!userInput.trim() || !analysis) return;

    const newMessage: ChatMessage = { role: 'user', content: userInput };
    setChatHistory(prev => [...prev, newMessage]);
    setUserInput('');
    setChatLoading(true);

    try {
      const response = await getStrategicAnalysis(analysis, [...chatHistory, newMessage]);
      setChatHistory(prev => [...prev, { role: 'model', content: response }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'model', content: 'Desculpe, encontrei um erro ao processar sua análise estratégica.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const exportTicket = async () => {
    if (!ticketRef.current) return;
    const canvas = await html2canvas(ticketRef.current, {
      backgroundColor: '#FDFCF5',
      scale: 2,
    });
    const link = document.createElement('a');
    link.download = `yuanware-analysis-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const resetAll = useCallback(() => {
    setAnalysis(null);
    setChatHistory([]);
    setItems([{ id: '1', name: '', priceYuan: 0, quantity: 1 }]);
    setFreight(0);
    setTax(0);
  }, []);

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF5]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Autenticando...</p>
        </div>
      </div>
    );
  }

  if (!supabase) {
    return <ConfigError />;
  }

  if (view === 'auth') {
    return <Auth onAuthSuccess={() => setView('dashboard')} />;
  }

  if (view === 'dashboard') {
    return (
      <div className="relative">
        <Dashboard 
          userEmail={user?.email || ''} 
          onSignOut={() => setView('auth')} 
        />
        <div className="fixed bottom-8 right-8 z-50">
          <button 
            onClick={() => setView('calculator')}
            className="luxury-button px-8 py-4 flex items-center gap-3 shadow-2xl hover:scale-105 transition-transform"
          >
            <Calculator size={20} />
            <span className="text-xs font-black uppercase tracking-widest">Abrir Calculadora</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF5] text-[#111111] font-sans selection:bg-black selection:text-white pb-20">
      <header className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
            <ShieldCheck className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase">Yuanware</h1>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Elite Calculator</p>
          </div>
        </div>
        
        <button 
          onClick={() => setView('dashboard')}
          className="px-6 py-3 bg-white border border-black/5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all luxury-shadow flex items-center gap-2"
        >
          <LayoutDashboard size={14} />
          Dashboard
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-8">
        {/* Painel de Entrada */}
        <div className="lg:col-span-5 space-y-10">
          <section className="bg-white p-10 rounded-[2.5rem] luxury-shadow border border-black/5">
            <h2 className="text-[11px] font-black tracking-[0.3em] mb-10 flex items-center gap-4 uppercase text-zinc-400">
              <span className="w-8 h-[1px] bg-black/20"></span>
              01. Itens do Lote (¥)
            </h2>
            
            <div className="space-y-8">
              {items.map((item) => (
                <ItemRow key={item.id} item={item} onUpdate={updateItem} onRemove={removeItem} />
              ))}
            </div>

            <button 
              onClick={addItem}
              className="mt-10 w-full py-4 rounded-full border border-black/10 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-all flex items-center justify-center gap-3"
            >
              <Plus size={14} /> Adicionar Item
            </button>
          </section>

          <section className="bg-white p-10 rounded-[2.5rem] luxury-shadow border border-black/5">
             <h2 className="text-[11px] font-black tracking-[0.3em] mb-8 flex items-center gap-4 uppercase text-zinc-400">
               <span className="w-8 h-[1px] bg-red/30"></span>
               02. Custos & Diluição
            </h2>

            <div className="flex gap-2 p-1 bg-zinc-100 rounded-full mb-8">
              <button 
                onClick={() => setDistributionMode('proportional')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all ${distributionMode === 'proportional' ? 'bg-black text-white shadow-lg' : 'text-zinc-400'}`}
              >
                Proporcional
              </button>
              <button 
                onClick={() => setDistributionMode('equal')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all ${distributionMode === 'equal' ? 'bg-black text-white shadow-lg' : 'text-zinc-400'}`}
              >
                Igual
              </button>
            </div>

             <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-3 block">Frete Total (¥)</label>
                  <input
                    type="number"
                    className="w-full bg-zinc-50 border-none p-4 text-xl font-mono rounded-2xl"
                    value={freight || ''}
                    onChange={(e) => setFreight(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-3 block">Spread R$</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-zinc-50 border-none p-4 text-xl font-mono rounded-2xl"
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-3 block">Taxação Total (R$)</label>
                  <input
                    type="number"
                    placeholder="Total pago em tributos"
                    className="w-full bg-zinc-50 border-none p-4 text-xl font-mono rounded-2xl"
                    value={tax || ''}
                    onChange={(e) => setTax(Number(e.target.value))}
                  />
                </div>
                <div className="col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block">Margem Sugerida</label>
                    <span className="text-xs font-black font-mono">{markup.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.5"
                    max="3.5"
                    step="0.1"
                    className="w-full accent-black"
                    value={markup}
                    onChange={(e) => setMarkup(Number(e.target.value))}
                  />
                </div>
             </div>

             <button 
              onClick={processData}
              disabled={loading}
              className="mt-12 w-full luxury-button py-6 text-sm font-bold tracking-[0.4em] uppercase flex items-center justify-center gap-4 shadow-xl active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Sincronizando...' : 'Calcular Lote'} <ArrowRight size={20} />
            </button>
          </section>
        </div>

        {/* Dashboard de Resultados */}
        <div className="lg:col-span-7 space-y-12">
          {analysis ? (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              
              <div className="p-12 rounded-[3rem] border border-black/5 flex flex-col md:flex-row items-center justify-between relative overflow-hidden bg-white luxury-shadow">
                <div className="absolute top-0 right-0 w-48 h-48 bg-zinc-50 rounded-full -mr-24 -mt-24"></div>
                <div className="flex items-center gap-10 z-10">
                  <div className={`p-6 rounded-[2rem] bg-zinc-50 ${analysis.verdict === 'RISKY' ? 'text-red' : 'text-black'}`}>
                    {analysis.verdict === 'GEM' ? <Diamond size={48} /> : analysis.verdict === 'HEALTHY' ? <ShieldCheck size={48} /> : <AlertTriangle size={48} />}
                  </div>
                  <div>
                    <h3 className="text-3xl font-serif italic mb-2">Análise de Viabilidade</h3>
                    <p className="text-[11px] text-zinc-400 font-black uppercase tracking-[0.3em]">Custo 100% Diluído Verificado</p>
                  </div>
                </div>
                <div className="mt-8 md:mt-0 text-center md:text-right z-10">
                  <p className="text-5xl font-black font-mono tracking-tighter">{analysis.roi.toFixed(1)}%</p>
                  <p className="text-[10px] font-black text-black uppercase tracking-[0.4em] mt-1">Retorno (ROI)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                  <CostCompositionChart 
                  product={items.reduce((acc, item) => acc + (item.priceYuan * item.quantity), 0) * rate} 
                  freight={freight * rate} 
                  tax={tax} 
                  total={analysis.totalInvestmentBRL} 
                  />
                  <div className="bg-black text-white rounded-[2.5rem] p-10 flex flex-col justify-between luxury-shadow overflow-hidden relative">
                    <div className="absolute -right-10 -bottom-10 opacity-10">
                      <TrendingUp size={200} />
                    </div>
                    <h4 className="text-[10px] font-black tracking-[0.4em] uppercase text-zinc-500 flex items-center gap-3 relative z-10">
                      <TrendingUp size={16} /> Potencial de Ganho
                    </h4>
                    <div className="space-y-2 mt-8 relative z-10">
                      <p className="text-4xl font-black font-mono tracking-tighter">
                        R$ {analysis.totalProfitBRL.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Lucro Líquido Estimado</p>
                    </div>
                    <div className="mt-10 pt-10 border-t border-white/10 relative z-10">
                      <p className="text-[9px] uppercase tracking-widest font-black text-zinc-500 mb-4 italic">Recomendação:</p>
                      <p className="text-sm font-serif italic leading-relaxed text-zinc-300">
                        {analysis.roi > 100 
                          ? "Escalabilidade máxima detectada. O custo diluído está ínfimo perante o potencial de venda." 
                          : "Operação saudável. Garanta o desembaraço rápido para manter a liquidez do capital."}
                      </p>
                    </div>
                  </div>
              </div>

              <div className="bg-white rounded-[3rem] border border-black/5 luxury-shadow overflow-hidden">
                <div className="p-8 border-b border-black/5 bg-zinc-50/50 flex items-center justify-between">
                  <p className="text-[11px] font-black tracking-[0.4em] uppercase text-zinc-400">Detalhamento Unitário (R$)</p>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Info size={14} />
                    <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-400">Dados Consolidados</span>
                  </div>
                </div>
                <div className="max-h-[500px] overflow-y-auto overflow-x-auto scroll-smooth custom-scrollbar">
                  <table className="w-full text-left table-auto border-collapse">
                    <thead className="bg-white sticky top-0 z-10 shadow-sm">
                      <tr className="text-[10px] text-zinc-400 uppercase font-black tracking-widest border-b border-black/5">
                        <th className="px-8 py-6">Item</th>
                        <th className="px-8 py-6">Custo Final</th>
                        <th className="px-8 py-6">Sugestão Venda</th>
                        <th className="px-8 py-6">Lucro Un.</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {analysis.items.map((item) => (
                        <ResultItemRow 
                          key={item.id} 
                          item={item} 
                          rate={rate} 
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-[3rem] border border-black/5 luxury-shadow overflow-hidden flex flex-col">
                <div className="bg-black text-white px-8 py-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Bot size={20} />
                    <span className="text-[11px] font-black uppercase tracking-[0.4em]">Consultoria Estratégica AI</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-red animate-pulse"></div>
                </div>
                <div className="h-80 overflow-y-auto p-8 space-y-8 text-sm custom-scrollbar">
                  {chatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-200 text-center space-y-4">
                      <MessageSquare size={48} strokeWidth={1} />
                      <p className="text-[10px] uppercase tracking-[0.2em] font-medium max-w-xs">Consulte sobre spread, lastro e viabilidade do hype.</p>
                    </div>
                  ) : chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-6 py-4 rounded-[1.5rem] leading-relaxed ${msg.role === 'user' ? 'bg-zinc-100 text-black font-medium' : 'bg-white border border-black/10 text-black italic shadow-sm'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && <div className="text-zinc-400 text-[11px] italic font-light px-6 animate-pulse">Analizando composição logística...</div>}
                </div>
                <div className="p-6 border-t border-black/5 flex gap-4 bg-zinc-50/50">
                  <input
                    type="text"
                    placeholder="Dúvidas sobre o ROI ou precificação?"
                    className="flex-1 bg-white border-none px-6 py-4 text-sm focus:ring-2 ring-black/5 rounded-full shadow-inner"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                  />
                  <button onClick={handleChat} disabled={chatLoading} className="bg-black text-white p-4 rounded-full hover:scale-110 transition-transform active:scale-95">
                    <Send size={18} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8 pt-8 pb-12">
                <button 
                  onClick={saveCalculation} 
                  disabled={isSaving}
                  className={`flex-1 rounded-full border-2 font-black py-6 text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 ${
                    saveStatus === 'success' ? 'bg-emerald-500 border-emerald-500 text-white' : 
                    saveStatus === 'error' ? 'bg-red border-red text-white' :
                    'border-black bg-black text-white hover:bg-white hover:text-black'
                  }`}
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                  {saveStatus === 'success' ? 'Salvo com Sucesso' : saveStatus === 'error' ? 'Erro ao Salvar' : 'Salvar na Nuvem'}
                </button>
                <button onClick={exportTicket} className="flex-1 rounded-full border-2 border-black bg-white text-black font-black py-6 text-xs uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95">
                  <Receipt size={20} /> Exportar DRE de Operação
                </button>
                <button onClick={resetAll} className="px-10 py-6 rounded-full bg-zinc-50 text-zinc-400 font-bold text-[10px] uppercase tracking-[0.3em] hover:text-red transition-all">
                  <RotateCcw size={16} /> Novo Lote
                </button>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-100 text-center space-y-12 py-32">
              <div className="relative">
                <LayoutDashboard size={120} strokeWidth={0.5} />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-24 h-24 border-t-2 border-black/10 rounded-full animate-spin"></div>
                </div>
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-200">Prepare o inventário ao lado para liberar o dashboard</p>
            </div>
          )}
        </div>
      </main>

      {/* Template de Ticket Oculto */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
        <div ref={ticketRef} className="w-[600px] bg-[#FDFCF5] p-20 rounded-[4rem] border-[15px] border-black flex flex-col items-center text-black shadow-2xl">
          <div className="w-full text-center border-b-2 border-black/10 pb-12 mb-12">
            <h1 className="text-5xl font-serif font-light tracking-[0.3em] mb-4 uppercase">YUANWARE<span className="font-bold">CALCULATOR</span></h1>
            <p className="text-[12px] tracking-[0.6em] font-black uppercase opacity-40">CERTIFICADO OPERACIONAL // ELITE GRADE</p>
          </div>
          <div className="w-full space-y-10 font-mono">
            <div className="flex justify-between items-end border-b border-black/5 pb-6">
              <span className="text-[11px] font-black opacity-30 uppercase tracking-[0.2em]">Custo Total Diluído</span>
              <span className="text-3xl font-black tracking-tighter">R$ {analysis?.totalInvestmentBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-end border-b border-black/5 pb-6">
              <span className="text-[11px] font-black opacity-30 uppercase tracking-[0.2em]">ROI Validado</span>
              <span className="text-3xl font-black tracking-tighter">{analysis?.roi.toFixed(1)}%</span>
            </div>
          </div>
          <div className="mt-20 w-full text-center space-y-8">
            <div className="py-6 rounded-3xl bg-black text-white px-10">
               <p className="text-lg font-serif italic tracking-[0.2em]">OPERAÇÃO LOGÍSTICA VERIFICADA</p>
            </div>
            <p className="text-[11px] tracking-[0.5em] font-black uppercase">🔥 powered by yuanwarecalculator</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
