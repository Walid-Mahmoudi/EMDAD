import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-luna';

function env(name) { return process.env[name] || ''; }

function db() {
  const url = env('NEXT_PUBLIC_SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side AI analysis.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function cleanJson(text) {
  const value = String(text || '').trim();
  if (!value) throw new Error('OpenAI returned an empty response.');
  try { return JSON.parse(value); } catch {}
  const match = value.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('OpenAI did not return valid JSON.');
  return JSON.parse(match[0]);
}

async function analyzeWithOpenAI(item) {
  const apiKey = env('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured in Vercel.');

  const prompt = `You are a senior HVAC sales operations analyst. Analyze the incoming project request below and return ONLY valid JSON. Do not invent facts. Use null when a field is not present or cannot be inferred reliably. If you infer a probability, clearly base it on the message context and keep it conservative.\n\nReturn exactly these keys:\ncompany_name, contact_name, project_name, project_type, location, consultant_name, hvac_system, estimated_value, expected_start, win_probability, temperature, summary, next_action\n\ntemperature must be one of: Hot, Warm, Cold, Unknown.\nwin_probability must be an integer 0-100 or null. estimated_value must be a number or null.\n\nSubject: ${item.subject || ''}\nSender: ${item.sender_name || ''} <${item.sender_address || ''}>\nReceived: ${item.received_at || ''}\nAttachments: ${JSON.stringify(item.ai_extracted_data?.attachment_names || [])}\n\nMessage:\n${item.body || ''}`;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      input: prompt,
      max_output_tokens: 1200,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `OpenAI request failed (${response.status}).`);

  const outputText = data.output_text || data.output?.flatMap(x => x.content || []).map(x => x.text || '').join('') || '';
  return cleanJson(outputText);
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const requestedId = body?.id || null;
    const limit = Math.min(Math.max(Number(body?.limit || 25), 1), 25);
    const supabase = db();

    let query = supabase
      .from('sales_inbox')
      .select('id,source,sender_name,sender_address,subject,body,received_at,status,ai_extracted_data')
      .in('status', ['new', 'reviewing'])
      .order('received_at', { ascending: false })
      .limit(requestedId ? 1 : limit);

    if (requestedId) query = query.eq('id', requestedId);

    const { data: items, error: fetchError } = await query;
    if (fetchError) throw fetchError;
    if (!items?.length) return Response.json({ ok: true, analyzed: 0, failed: 0, results: [], message: 'No new or reviewing messages to analyze.' });

    const results = [];
    for (const item of items) {
      try {
        const extracted = await analyzeWithOpenAI(item);
        const summary = extracted.summary || 'AI analysis completed.';
        const nextAction = extracted.next_action || 'Review request and decide next action.';
        const merged = {
          ...(item.ai_extracted_data || {}),
          ...extracted,
          analyzed_at: new Date().toISOString(),
          model: MODEL,
        };

        const { error: updateError } = await supabase
          .from('sales_inbox')
          .update({
            ai_extracted_data: merged,
            ai_summary: summary,
            suggested_action: nextAction,
          })
          .eq('id', item.id);
        if (updateError) throw updateError;
        results.push({ id: item.id, ok: true, temperature: extracted.temperature || 'Unknown', win_probability: extracted.win_probability ?? null });
      } catch (error) {
        results.push({ id: item.id, ok: false, error: error.message || String(error) });
      }
    }

    const analyzed = results.filter(x => x.ok).length;
    return Response.json({ ok: true, analyzed, failed: results.length - analyzed, results, model: MODEL });
  } catch (error) {
    return Response.json({ ok: false, error: error.message || String(error) }, { status: 500 });
  }
}
