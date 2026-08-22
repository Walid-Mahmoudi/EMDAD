import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: requester, error: requesterError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (requesterError || requester?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on Vercel' }, { status: 500 });
    }

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

    const admin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // The email may already exist in Supabase Auth (for example, after a previous
    // interrupted employee creation). Reuse that Auth user only when there is no
    // existing CRM profile; never overwrite an existing employee profile here.
    let authUser = null;
    let createdAuthUser = false;

    const { data: usersPage, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    authUser = usersPage?.users?.find((candidate) => candidate.email?.toLowerCase() === email) || null;

    if (authUser) {
      const { data: existingProfile, error: existingProfileError } = await admin
        .from('profiles')
        .select('id,full_name,role,is_active')
        .eq('id', authUser.id)
        .maybeSingle();

      if (existingProfileError) {
        return NextResponse.json({ error: existingProfileError.message }, { status: 500 });
      }

      if (existingProfile) {
        return NextResponse.json({ error: 'An employee with this email already exists.' }, { status: 409 });
      }
    } else {
      const { data: created, error: authError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role },
      });

      if (authError || !created?.user) {
        return NextResponse.json({ error: authError?.message || 'Unable to create authentication account' }, { status: 400 });
      }

      authUser = created.user;
      createdAuthUser = true;
    }

    const { error: profileError } = await admin.from('profiles').insert({
      id: authUser.id,
      full_name,
      role,
      position,
      phone,
      is_active,
    });

    if (profileError) {
      if (createdAuthUser) await admin.auth.admin.deleteUser(authUser.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      employee: { id: authUser.id, full_name, email, role, position, phone, is_active },
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Unable to create employee' }, { status: 500 });
  }
}
