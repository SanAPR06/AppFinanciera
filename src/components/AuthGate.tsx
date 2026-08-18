import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    // Sin credenciales configuradas: la app sigue funcionando en modo local.
    return <>{children}</>;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-graphite">Cargando...</div>;
  }

  if (session) {
    return <>{children}</>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!supabase) return;

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setInfo('Cuenta creada. Revisa tu correo para confirmar (si aplica) o inicia sesión.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-off-white-canvas dark:bg-off-black-ink p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-pure-white dark:bg-deep-charcoal rounded-cards p-6 w-full max-w-sm flex flex-col gap-3"
      >
        <h1 className="text-heading font-medium text-off-black-ink dark:text-off-white-canvas text-center tracking-heading">
          Mis Finanzas
        </h1>
        <p className="text-sm text-graphite dark:text-smoke text-center mb-2">
          {mode === 'signin' ? 'Inicia sesión' : 'Crea tu cuenta'}
        </p>

        <label className="flex flex-col gap-1 text-sm text-graphite dark:text-smoke">
          Email
          <input
            type="email"
            required
            className="border border-ash dark:border-graphite/40 dark:bg-deep-charcoal dark:text-off-white-canvas rounded-inputs px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-graphite dark:text-smoke">
          Contraseña
          <input
            type="password"
            required
            minLength={6}
            className="border border-ash dark:border-graphite/40 dark:bg-deep-charcoal dark:text-off-white-canvas rounded-inputs px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {info && <p className="text-sm text-emerald-600">{info}</p>}

        <button
          type="submit"
          className="px-5 py-2.5 rounded-buttons bg-electric-lime text-off-black-ink hover:opacity-90 font-medium mt-1"
        >
          {mode === 'signin' ? 'Entrar' : 'Registrarme'}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="text-sm text-off-black-ink dark:text-off-white-canvas hover:underline"
        >
          {mode === 'signin' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </form>
    </div>
  );
}
