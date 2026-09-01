import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return Response.json({ ok: false, stage: 'environment', message: 'Supabase environment variables are missing' }, { status: 500 });
  }

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const { data, error } = await supabase.rpc('dashboard_summary');
    if (error) {
      return Response.json({ ok: false, stage: 'supabase', message: error.message, code: error.code || null }, { status: 502 });
    }
    return Response.json({ ok: true, stage: 'supabase', project: new URL(url).hostname.split('.')[0], dashboard: data ?? null, timestamp: new Date().toISOString() });
  } catch (error) {
    return Response.json({ ok: false, stage: 'network', message: error?.message || 'Supabase connection failed' }, { status: 502 });
  }
}
