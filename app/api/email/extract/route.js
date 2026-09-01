import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-luna';

function env(name) { return process.env[name] || ''; }

function supabaseServer() {
  const url = env('NEXT_PUBLIC_SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_ROLE_KEY') || env('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || env('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !key) throw new Error('Supabase environment variables are missing.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function authorized(request) {
  const configuredToken = env('EMAIL_SYNC_TOKEN');
  if (configuredToken) return request.headers.get('authorization') === `Bearer ${configuredToken}`;
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    company_name: { type: ['string', 'null'] },
    contact_name: { type: ['string', 'null'] },
    contact_email: { type: ['string', 'null'] },
    project_name: { type: ['string', 'null'] },
    project_type: { type: ['string', 'null'] },
    location: { type: ['string', 'null'] },
    consultant_name: { type: ['string', 'null'] },
    hvac_system: { type: ['string', 'null'] },
    estimated_value: { type: ['number', 'null'] },
    expected_start: { type: ['string', 'null'] },
    win_probability: { type: ['number', 'null'] },
    temperature: { type: ['string', 'null'] },
    attachments: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
    next_action: { type: 'string' },
    priority: { type: 'string', enum: ['hot', 'warm', 'cold', 'unknown'] }
  },
  required: ['company_name','contact_name','contact_email','project_name','project_type','location','consultant_name','hvac_system','estimated_value','expected_start','win_probability','temperature','attachments','summary','next_action','priority']
};

function extractOutputText(data) {
  if (typeof data?.output_text === 'string') return data.output_text;
  for (const item of data?.output || []) {
    for (const part of item?.content || []) {
      if (typeof part?.text === 'string') return part.text;
      if (typeof part?.text?.value === 'string') return part.text.value;
    }
  }
  return '';
}

export async function POST(request) {
  if (!authorized(request)) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const openaiKey = env('OPENAI_API_KEY');
  if (!openaiKey) return Response.json({ ok: false, error: 'OPENAI_API_KEY is not configured in Vercel.' }, { status: 400 });

  let payload;
  try { payload = await request.json(); } catch { return Response.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 }); }
  const inboxId = payload?.inbox_id;
  if (!inboxId) return Response.json({ ok: false, error: 'inbox_id is required.' }, { status: 400 });

  const sb = supabaseServer();
  const { data: item, error: loadError } = await sb.from('sales_inbox').select('id,source,sender_name,sender_address,subject,body,received_at,ai_extracted_data').eq('id', inboxId).single();
  if (loadError) return Response.json({ ok: false, error: loadError.message }, { status: 404 });

  const sourceData = item.ai_extracted_data || {};
  const attachmentNames = Array.isArray(sourceData.attachment_names) ? sourceData.attachment_names : [];
  const userText = [
    `From: ${item.sender_name || ''} <${item.sender_address || ''}>`,
    `Subject: ${item.subject || ''}`,
    `Received: ${item.received_at || ''}`,
    `Attachment names: ${attachmentNames.join(', ') || 'None'}`,
    '',
    item.body || ''
  ].join('\n');

  const system = `You are a sales operations analyst for an HVAC/MEP contractor in Egypt. Extract only facts supported by the email. Never invent a company, value, consultant, date, or technical requirement. Use null when missing. estimated_value must be numeric EGP only when a monetary value is explicitly stated; otherwise null. win_probability is an integer 0-100 based only on explicit buying signals in the message, and should be null when there is not enough evidence. priority is hot only for strong immediate buying/tender signals, warm for a credible opportunity, cold for weak/general inquiry, otherwise unknown. project_type should describe the project sector/type (administrative, commercial, residential, industrial, hospital, hotel, etc.). hvac_system should capture VRF, chiller, AHU, package, split, etc. next_action must be a practical sales action such as call client, review BOQ, send quotation, visit consultant, or request missing drawings. Write the summary in concise English.`;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: MODEL,
      input: [
        { role: 'system', content: [{ type: 'input_text', text: system }] },
        { role: 'user', content: [{ type: 'input_text', text: userText.slice(0, 30000) }] }
      ],
      text: { format: { type: 'json_schema', name: 'hvac_project_extraction', strict: true, schema } }
    })
  });

  const data = await response.json();
  if (!response.ok) return Response.json({ ok: false, stage: 'openai', error: data?.error?.message || 'OpenAI request failed.' }, { status: 502 });

  const raw = extractOutputText(data);
  let extracted;
  try { extracted = JSON.parse(raw); } catch { return Response.json({ ok: false, stage: 'openai', error: 'AI returned invalid structured output.' }, { status: 502 }); }

  const update = {
    ai_summary: extracted.summary || null,
    ai_extracted_data: { ...sourceData, ...extracted, ai_model: MODEL, extracted_at: new Date().toISOString() },
    suggested_action: extracted.next_action || 'Review incoming project request'
  };
  const { error: updateError } = await sb.from('sales_inbox').update(update).eq('id', inboxId);
  if (updateError) return Response.json({ ok: false, stage: 'supabase', error: updateError.message }, { status: 502 });

  return Response.json({ ok: true, model: MODEL, inbox_id: inboxId, extracted });
}
