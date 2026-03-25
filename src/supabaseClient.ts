import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Inicialização segura do cliente Supabase
// Usamos globalThis.fetch diretamente para evitar tocar em window.fetch de forma que 
// possa disparar polyfills ou erros de permissão em iframes restritos.
const safeFetch = (...args: any[]) => {
  const f = (globalThis as any).fetch || (typeof window !== 'undefined' ? window.fetch : undefined);
  if (!f) throw new Error('Fetch not available');
  return f(...args);
};

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: safeFetch,
      },
    })
  : null as unknown as SupabaseClient;

export const getSupabase = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Supabase não configurado. Verifique as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }
  return supabase;
};
