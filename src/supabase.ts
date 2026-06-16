import { createClient } from "@supabase/supabase-js";

// Conexión a Supabase usando variables de entorno de Vite (para Netlify / Cloudflare Pages / Vercel o local)
const supabaseUrl = (import.meta as any).env?.SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env?.SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

