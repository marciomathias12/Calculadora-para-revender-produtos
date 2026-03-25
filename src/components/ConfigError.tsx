import React from 'react';
import { AlertTriangle, Settings } from 'lucide-react';

export const ConfigError: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFCF5] p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 luxury-shadow border border-black/5 text-center">
        <div className="w-16 h-16 bg-red/10 text-red rounded-2xl flex items-center justify-center mb-6 mx-auto">
          <AlertTriangle size={32} />
        </div>
        <h1 className="text-2xl font-black tracking-tighter text-black uppercase mb-4">
          Configuração Necessária
        </h1>
        <p className="text-zinc-500 text-sm leading-relaxed mb-8">
          As variáveis de ambiente do Supabase não foram encontradas. Por favor, configure <strong>VITE_SUPABASE_URL</strong> e <strong>VITE_SUPABASE_ANON_KEY</strong> no painel do projeto.
        </p>
        <div className="p-4 bg-zinc-50 rounded-2xl text-left">
          <div className="flex items-center gap-2 mb-2">
            <Settings size={14} className="text-zinc-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Instruções</span>
          </div>
          <ol className="text-[11px] text-zinc-600 space-y-2 list-decimal ml-4">
            <li>Acesse o dashboard do Supabase</li>
            <li>Vá em Project Settings &gt; API</li>
            <li>Copie a URL e a Anon Key</li>
            <li>Adicione-as como variáveis de ambiente na plataforma</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
