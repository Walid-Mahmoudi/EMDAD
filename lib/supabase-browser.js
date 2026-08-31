import { createClient } from '@supabase/supabase-js';

// Production fallback points to the active Sales CRM project.
// NEXT_PUBLIC_* env vars can still override these values in Vercel.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wnezgrrgvugezqwfeuce.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_MSCLzBSq5UHwPk6F9TUuNA_-ugwxuyu';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
