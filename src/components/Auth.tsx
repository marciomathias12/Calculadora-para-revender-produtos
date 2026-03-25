import React, { useState } from 'react';
import { getSupabase } from '../supabaseClient';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!isLogin && password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      if (isLogin) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;
        onAuthSuccess();
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF5] p-6">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 luxury-shadow border border-black/5 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <ShieldCheck className="text-white" size={40} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Conta Criada!</h2>
          <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-8">
            Enviamos um link de confirmação para o seu e-mail. Por favor, verifique sua caixa de entrada para ativar sua conta de elite.
          </p>
          <button
            onClick={() => setIsLogin(true)}
            className="w-full luxury-button py-4 font-black uppercase tracking-widest text-xs"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFCF5] p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 luxury-shadow border border-black/5 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 shadow-xl rotate-3 hover:rotate-0 transition-transform duration-300">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-black uppercase">
            {isLogin ? 'Yuanware Login' : 'Criar Conta'}
          </h1>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mt-2">
            {isLogin ? 'Acesse sua suíte de importação' : 'Comece sua jornada de elite'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red/5 border border-red/10 rounded-2xl flex items-center gap-3 text-red text-sm font-medium animate-in slide-in-from-top-2">
            <div className="w-2 h-2 rounded-full bg-red animate-pulse" />
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
              <input
                type="email"
                required
                className="w-full bg-zinc-50 border-none pl-12 pr-4 py-4 text-sm font-medium focus:ring-2 ring-black/5 transition-all rounded-2xl"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
              <input
                type="password"
                required
                className="w-full bg-zinc-50 border-none pl-12 pr-4 py-4 text-sm font-medium focus:ring-2 ring-black/5 transition-all rounded-2xl"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                <input
                  type="password"
                  required
                  className="w-full bg-zinc-50 border-none pl-12 pr-4 py-4 text-sm font-medium focus:ring-2 ring-black/5 transition-all rounded-2xl"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full luxury-button py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                {isLogin ? 'Entrar' : 'Cadastrar'}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre aqui'}
          </button>
        </div>
      </div>
    </div>
  );
};
