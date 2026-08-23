import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createAdminClient() {
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export async function POST(req) {
  let createdUserId = null;

  try {
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!url || !anonKey || !serviceKey) {
      return NextResponse.json(
        { error: 'Server Supabase configuration is incomplete. Check Vercel environment variables.' },
        { status: 500 }
      );
    }

    // Use the logged-in administrator JWT for all public-table operations.
    // This makes the request satisfy the existing profiles_insert_admin RLS policy.
    const userClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser(token);
    const currentUser = authData?.user;

    if (authError || !currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: me, error: profileCheckError } = await userClient
      .from('profiles')
      .select('role,is_active')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (profileCheckError) {
      return NextResponse.json({ error: profileCheckError.message }, { status: 500 });
    }

    if (!me || me.role !== 'admin' || !me.is_active) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { full_name, email, password, phone, job_title } = await req.json();

    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: 'Full name, email and password are required' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Auth creation requires the server-side service role.
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    });

    if (createError || !created?.user) {
      return NextResponse.json(
        { error: createError?.message || 'Failed to create authentication user' },
        { status: 400 }
      );
    }

    createdUserId = created.user.id;

    // IMPORTANT FIX: insert the profile with the authenticated ADMIN JWT.
    // The existing RLS policy is: INSERT for authenticated, WITH CHECK is_admin().
    const { error: profileError } = await userClient.from('profiles').insert({
      id: createdUserId,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      job_title: job_title?.trim() || null,
      role: 'employee',
      is_active: true,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(createdUserId);
      createdUserId = null;
      return NextResponse.json(
        { error: `Employee profile could not be created: ${profileError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, user_id: createdUserId });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || 'Unexpected server error' },
      { status: 500 }
    );
  }
}
