import { createClient } from '@supabase/supabase-js';

const ACTIVE_SUPABASE_URL = 'https://wnezgrrgvugezqwfeuce.supabase.co';
const ACTIVE_SUPABASE_KEY = 'sb_publishable_MSCLzBSq5UHwPk6F9TUuNA_-ugwxuyu';

export async function GET() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const checks = {
    envUrlPresent: Boolean(envUrl),
    envKeyPresent: Boolean(envKey),
    envProject: envUrl ? new URL(envUrl).hostname.split('.')[0] : null,
    activeProject: 'wnezgrrgvugezqwfeuce',
  };

  try {
    const supabase = createClient(ACTIVE_SUPABASE_URL, ACTIVE_SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await supabase.rpc('dashboard_summary');
    if (error) {
      return Response.json({ ok: false, stage: 'supabase', message: error.message, code: error.code || null, checks }, { status: 502 });
    }
    return Response.json({ ok: true, stage: 'supabase', project: 'wnezgrrgvugezqwfeuce', envProject: checks.envProject, envMatchesActiveProject: checks.envProject === checks.activeProject, dashboard: data ?? null, timestamp: new Date().toISOString() });
  } catch (error) {
    return Response.json({ ok: false, stage: 'network', message: error?.message || 'Supabase connection failed', checks }, { status: 502 });
  }
}
