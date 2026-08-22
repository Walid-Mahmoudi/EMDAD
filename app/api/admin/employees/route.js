import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: requester, error: requesterError } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (requesterError || requester?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on Vercel' }, { status: 500 });

    const body = await request.json();
    const full_name = String(body.full_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const role = body.role === 'admin' ? 'admin' : 'employee';
    const position = String(body.position || '').trim() || null;
    const phone = String(body.phone || '').trim() || null;
    const is_active = body.is_active !== false;

    if (!full_name || !email || password.length < 8) {
      return NextResponse.json({ error: 'Full name, valid email, and password of at least 8 characters are required.' }, { status: 400 });
    }

    const admin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });

    // The Auth Admin API is the source of truth for email uniqueness.
    // Do not pre-block the request based on a profiles lookup: an Auth user can
    // exist without a profile, and listUsers is paginated and can be stale for
    // this workflow. createUser gives the authoritative result from Supabase.
    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    });

    if (authError || !created?.user) {
      const message = authError?.message || 'Unable to create authentication account';

      // If the email belongs to an existing Auth user, distinguish that case
      // from every other Auth failure and return a clear message.
      if (/already registered|already exists|user.*exists|email.*exists/i.test(message)) {
        return NextResponse.json({ error: `This email is already registered in Supabase Auth: ${email}` }, { status: 409 });
      }

      return NextResponse.json({ error: message }, { status: 400 });
    }

    const authUser = created.user;

    const { error: profileError } = await admin.from('profiles').insert({
      id: authUser.id,
      full_name,
      role,
      position,
      phone,
      is_active,
    });

    if (profileError) {
      // Roll back the Auth account if the application profile cannot be created.
      await admin.auth.admin.deleteUser(authUser.id);
      return NextResponse.json({ error: `Employee profile could not be created: ${profileError.message}` }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      employee: { id: authUser.id, full_name, email, role, position, phone, is_active },
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Unable to create employee' }, { status: 500 });
  }
}
