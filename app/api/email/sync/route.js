import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function env(name) { return process.env[name] || ''; }

function supabaseServer() {
  const url = env('NEXT_PUBLIC_SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_ROLE_KEY') || env('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || env('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !key) throw new Error('Supabase environment variables are missing.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function normalizeText(value) { return String(value || '').replace(/\r\n/g, '\n').trim(); }

function authorized(request) {
  const configuredToken = env('EMAIL_SYNC_TOKEN');
  if (configuredToken) return request.headers.get('authorization') === `Bearer ${configuredToken}`;
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}

export async function POST(request) {
  if (!authorized(request)) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const host = env('EMAIL_IMAP_HOST') || 'mail.emdad.net';
  const port = Number(env('EMAIL_IMAP_PORT') || 993);
  const user = env('EMAIL_IMAP_USER') || 'w.mahmoudi@emdad.net';
  const password = env('EMAIL_IMAP_PASSWORD');
  const secure = String(env('EMAIL_IMAP_SECURE') || 'true').toLowerCase() !== 'false';
  if (!password) return Response.json({ ok: false, error: 'EMAIL_IMAP_PASSWORD is not configured in Vercel.' }, { status: 400 });

  const client = new ImapFlow({ host, port, secure, auth: { user, pass: password }, logger: false, tls: { rejectUnauthorized: true } });
  let inserted = 0, skipped = 0, scanned = 0;
  const errors = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      // Fetch the latest 50 messages directly by sequence range. This avoids
      // search/UID ambiguity and is the documented ImapFlow pattern for recent mail.
      const messages = await client.fetchAll('*:-50', { envelope: true, source: true, uid: true });
      scanned = messages.length;
      const sb = supabaseServer();

      for (const message of messages) {
        const uid = message.uid;
        try {
          const parsed = await simpleParser(message.source);
          const externalId = parsed.messageId || `${host}:INBOX:${uid}`;
          const sender = parsed.from?.value?.[0];
          const senderAddress = sender?.address || '';
          const senderName = sender?.name || senderAddress || '';
          const subject = normalizeText(parsed.subject) || 'Project request';
          const body = normalizeText(parsed.text || parsed.html || '');
          const receivedAt = parsed.date || message.envelope?.date || new Date();
          const attachmentNames = (parsed.attachments || []).map(a => a.filename).filter(Boolean);

          const { data: existing, error: existingError } = await sb.from('sales_inbox').select('id').eq('source', 'email').eq('external_message_id', externalId).maybeSingle();
          if (existingError) throw existingError;
          if (existing) { skipped += 1; continue; }

          const { error: insertError } = await sb.from('sales_inbox').insert({
            source: 'email',
            external_message_id: externalId,
            sender_name: senderName,
            sender_address: senderAddress,
            subject,
            body,
            received_at: new Date(receivedAt).toISOString(),
            status: 'new',
            ai_extracted_data: { source: 'outlook_imap', attachment_names: attachmentNames, has_attachments: attachmentNames.length > 0 },
            suggested_action: 'Review incoming project request',
          });
          if (insertError) throw insertError;
          inserted += 1;
        } catch (error) {
          errors.push(`UID ${uid}: ${error.message || String(error)}`);
        }
      }
    } finally { lock.release(); }
    await client.logout();
    return Response.json({ ok: true, host, mailbox: 'INBOX', scanned, inserted, skipped, errors });
  } catch (error) {
    try { await client.logout(); } catch {}
    return Response.json({ ok: false, stage: 'imap', host, port, user, scanned, inserted, skipped, errors, error: error.message || String(error) }, { status: 502 });
  }
}
