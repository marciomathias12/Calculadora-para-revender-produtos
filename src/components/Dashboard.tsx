import React, { useEffect, useState } from 'react';
import { getSupabase } from '../supabaseClient';
import { LogOut, User, LayoutDashboard, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

interface DashboardProps {
  userEmail: string;
  onSignOut: () => void;
}

interface Profile {
  plan_type: string;
  last_access: string;
}

interface CalculationHistory {
  id: string;
  name: string;
  total_profit_brl: number;
  roi: number;
  created_at: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ userEmail, onSignOut }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Busca Perfil
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('plan_type, last_access')
            .eq('id', user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.warn('Erro ao buscar perfil:', profileError);
          } else {
            setProfile(profileData);
          }

          // Busca Histórico de Cálculos
          const { data: historyData, error: historyError } = await supabase
            .from('calculations')
            .select('id, name, total_profit_brl, roi, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

          if (historyError) {
            console.warn('Erro ao buscar histórico:', historyError);
          } else {
            setHistory(historyData || []);
          }
        }
      } catch (e: any) {
        console.error('Erro ao buscar dados:', e);
        setError('Erro de conexão com o banco de dados.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      onSignOut();
    } catch (e) {
      console.error('Erro ao sair:', e);
      onSignOut();
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF5] p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter uppercase">Yuanware</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Dashboard de Elite</p>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-black/5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all luxury-shadow"
          >
            <LogOut size={14} />
            Sair
          </button>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="col-span-1 md:col-span-2 bg-black text-white rounded-[2.5rem] p-10 luxury-shadow relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Sessão Ativa</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
                Bem-vindo,<br />
                <span className="text-zinc-500">{userEmail.split('@')[0]}</span>
              </h1>
              <p className="text-zinc-400 text-sm max-w-md font-medium leading-relaxed mb-8">
                Você está autenticado na plataforma de cálculo de importação mais avançada do mercado. Seus dados estão protegidos por criptografia de ponta.
              </p>
              <div className="flex gap-4">
                <div className="px-6 py-3 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <User size={14} />
                  {userEmail}
                </div>
              </div>
            </div>
            
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-zinc-800 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="absolute top-10 right-10 opacity-10">
              <LayoutDashboard size={120} />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-10 luxury-shadow border border-black/5 animate-in fade-in slide-in-from-left-4 duration-700 delay-150">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
              <ArrowRight size={14} className="text-black" /> Status da Conta
            </h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-zinc-300" size={24} />
              </div>
            ) : error ? (
              <div className="p-4 bg-red/5 border border-red/10 rounded-2xl text-red text-[10px] font-bold uppercase tracking-widest text-center">
                {error}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-black/5">
                  <span className="text-sm font-bold text-zinc-500">Plano Atual</span>
                  <span className="text-xs font-black uppercase tracking-widest bg-black text-white px-3 py-1 rounded-full">
                    {profile?.plan_type || 'Elite'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-black/5">
                  <span className="text-sm font-bold text-zinc-500">Verificação</span>
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Confirmada</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-zinc-500">Último Acesso</span>
                  <span className="text-xs font-mono font-bold text-zinc-400">
                    {profile?.last_access ? new Date(profile.last_access).toLocaleDateString() : new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2.5rem] p-10 luxury-shadow border border-black/5 animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
              <ArrowRight size={14} className="text-black" /> Histórico Recente
            </h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-zinc-300" size={24} />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-zinc-400 font-medium">Nenhum cálculo salvo ainda.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((calc) => (
                  <div key={calc.id} className="p-4 bg-zinc-50 rounded-2xl flex justify-between items-center group hover:bg-black hover:text-white transition-all cursor-default">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-tight">{calc.name}</p>
                      <p className="text-[9px] font-bold text-zinc-400 group-hover:text-zinc-500">
                        {new Date(calc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black font-mono">R$ {calc.total_profit_brl.toFixed(0)}</p>
                      <p className={`text-[9px] font-bold ${calc.roi >= 50 ? 'text-emerald-500' : 'text-red'}`}>
                        {calc.roi.toFixed(1)}% ROI
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
