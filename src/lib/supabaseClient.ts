import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Se activa automáticamente cuando defines VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en .env
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
export const isSupabaseConfigured = supabase !== null;
