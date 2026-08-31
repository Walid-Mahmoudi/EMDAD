'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase-browser';

export default function QuickCapture() {
  const [form, setForm] = useState({ source: 'manual', sender_name: '', sender_address: '', subject: '', body: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    setBusy(true); setMessage(''); setError('');
    try {
      if (!form.body.trim() && !form.subject.trim()) throw new Error('Enter a subject or message first.');
      const { error: e } = await supabase.from('sales_inbox').insert({
        source: form.source,
        sender_name: form.sender_name || null,
        sender_address: form.sender_address || null,
        subject: form.subject || null,
        body: form.body || null,
        status: 'new'
      });
      if (e) throw e;
      setForm({ source: 'manual', sender_name: '', sender_address: '', subject: '', body: '' });
      setMessage('Captured successfully. It is now in Sales Inbox.');
    } catch (e) { setError(e.message || 'Unable to save.'); }
    setBusy(false);
  }

  return <main style={S.page}>
    <section style={S.card}>
      <div style={S.eyebrow}>EMDAD SALES CRM</div>
      <h1 style={S.title}>Quick Capture</h1>
      <p style={S.sub}>Capture an email, WhatsApp message, lead, or sales note without opening the full CRM.</p>

      {error && <div style={S.error}>{error}</div>}
      {message && <div style={S.success}>{message}</div>}

      <div style={S.grid}>
        <label style={S.field}><span>Source</span><select value={form.source} onChange={e=>set('source',e.target.value)}><option value="manual">Manual</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="website">Website</option><option value="referral">Referral</option><option value="other">Other</option></select></label>
        <label style={S.field}><span>Sender / Contact</span><input value={form.sender_name} onChange={e=>set('sender_name',e.target.value)} placeholder="Ahmed Ali" /></label>
        <label style={S.field}><span>Email / Phone</span><input value={form.sender_address} onChange={e=>set('sender_address',e.target.value)} placeholder="contact details" /></label>
        <label style={S.field}><span>Subject / Lead Title</span><input value={form.subject} onChange={e=>set('subject',e.target.value)} placeholder="New HVAC quotation request" /></label>
      </div>
      <label style={S.field}><span>Message / Notes</span><textarea value={form.body} onChange={e=>set('body',e.target.value)} placeholder="Paste the message or write the sales note here..." rows={10} /></label>
      <div style={S.actions}><button onClick={()=>location.href='/'} style={S.secondary}>Back to CRM</button><button disabled={busy} onClick={save} style={S.primary}>{busy ? 'Saving…' : 'Capture Lead →'}</button></div>
    </section>
  </main>
}

const S={page:{minHeight:'100vh',background:'#f4f6f8',padding:'48px 20px',fontFamily:'Inter,Arial,sans-serif',color:'#18212b'},card:{maxWidth:900,margin:'0 auto',background:'#fff',border:'1px solid #e4e8ed',borderRadius:20,padding:36,boxShadow:'0 18px 50px rgba(20,30,40,.08)'},eyebrow:{fontSize:12,fontWeight:800,letterSpacing:1.5,color:'#b3262e'},title:{fontSize:36,margin:'8px 0 4px'},sub:{color:'#66717d',margin:'0 0 28px',lineHeight:1.6},grid:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18},field:{display:'flex',flexDirection:'column',gap:7,marginBottom:18},fieldSpan:{fontSize:13},input:{},actions:{display:'flex',justifyContent:'flex-end',gap:12,marginTop:10},primary:{border:0,borderRadius:10,padding:'12px 18px',background:'#b3262e',color:'#fff',fontWeight:800,cursor:'pointer'},secondary:{border:'1px solid #d7dde3',borderRadius:10,padding:'12px 18px',background:'#fff',color:'#25313d',fontWeight:700,cursor:'pointer'},error:{background:'#fff0f0',color:'#9f1d25',padding:12,borderRadius:10,marginBottom:18},success:{background:'#eefaf1',color:'#23733a',padding:12,borderRadius:10,marginBottom:18}}

if (typeof document !== 'undefined') { document.querySelectorAll('input,select,textarea').forEach(el=>{el.style.border='1px solid #d7dde3';el.style.borderRadius='9px';el.style.padding='11px';el.style.fontSize='14px';el.style.fontFamily='inherit'}); }
