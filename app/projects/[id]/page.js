'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const stages = ['Lead','Technical / Pricing','Tender','On Hand','Negotiation','Won / Contract','Collection','Closed','Lost'];
const activityTypes = ['Phone Call','Meeting','Site Visit','Customer Visit','Consultant Visit','Contractor Visit','Technical Meeting','Pricing Follow-up','Tender Follow-up','Negotiation','Email','WhatsApp','Other'];

export default function ProjectWorkspace() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activity, setActivity] = useState({ activity_type:'Phone Call', activity_date:'', notes:'', result:'', next_follow_up_date:'', next_action:'', status:'Planned' });
  const [collection, setCollection] = useState({ invoice_number:'', invoice_date:'', due_date:'', required_amount:'', collected_amount:'', collection_date:'', notes:'' });

  async function load() {
    setLoading(true);
    const [{ data: p, error: pe }, { data: events }] = await Promise.all([
      supabase.from('projects').select('*, companies(company_name), profiles:assigned_employee_id(full_name)').eq('id', id).single(),
      supabase.from('crm_project_timeline').select('*').eq('project_id', id).order('event_date', { ascending: false }),
    ]);
    if (!pe) { setProject(p); setTimeline(events || []); }
    setLoading(false);
  }
  useEffect(() => { if (id) load(); }, [id]);

  async function changeStage(sales_stage) {
    setSaving(true); setMessage('');
    const { error } = await supabase.from('projects').update({ sales_stage }).eq('id', id);
    setSaving(false); setMessage(error ? error.message : 'Stage updated successfully.');
    if (!error) load();
  }

  async function addActivity(e) {
    e.preventDefault(); setSaving(true); setMessage('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); setMessage('Please sign in again.'); return; }
    const payload = { ...activity, project_id:id, company_id:project.company_id, employee_id:user.id };
    const { error } = await supabase.from('activities').insert(payload);
    setSaving(false); setMessage(error ? error.message : 'Activity added successfully.');
    if (!error) { setActivity({ activity_type:'Phone Call', activity_date:'', notes:'', result:'', next_follow_up_date:'', next_action:'', status:'Planned' }); load(); }
  }

  async function addCollection(e) {
    e.preventDefault(); setSaving(true); setMessage('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); setMessage('Please sign in again.'); return; }
    const payload = { ...collection, project_id:id, company_id:project.company_id, employee_id:user.id };
    const { error } = await supabase.from('collections').insert(payload);
    setSaving(false); setMessage(error ? error.message : 'Collection added successfully.');
    if (!error) { setCollection({ invoice_number:'', invoice_date:'', due_date:'', required_amount:'', collected_amount:'', collection_date:'', notes:'' }); load(); }
  }

  if (loading) return <main className="p-6">Loading project...</main>;
  if (!project) return <main className="p-6">Project not found.</main>;
  const money = v => new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(Number(v||0));
  const weighted = Number(project.expected_value||0)*Number(project.probability||0)/100;

  return <main className="p-6 space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm text-gray-500">Project Workspace</p><h1 className="text-3xl font-semibold">{project.project_name}</h1><p className="text-gray-600">{project.companies?.company_name || '—'}</p></div>
      <div><select value={project.sales_stage || 'Lead'} disabled={saving} onChange={e=>changeStage(e.target.value)} className="rounded-lg border px-3 py-2"><option value="">Stage</option>{stages.map(s=><option key={s}>{s}</option>)}</select><div className="mt-1 text-sm text-gray-500">Probability: {project.probability ?? 0}%</div></div>
    </header>
    {message && <div className="rounded-lg border bg-white p-3 text-sm">{message}</div>}
    <section className="grid gap-4 md:grid-cols-4"><Card title="Expected Value" value={money(project.expected_value)}/><Card title="Weighted Value" value={money(weighted)}/><Card title="Contract Value" value={money(project.actual_contract_value)}/><Card title="Expected Closing" value={project.expected_closing_date || '—'}/></section>
    <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="rounded-xl border bg-white p-5"><h2 className="mb-4 text-xl font-semibold">Project Timeline</h2><div className="space-y-4">{timeline.length===0&&<p className="text-sm text-gray-500">No timeline events yet.</p>}{timeline.map(event=><div key={`${event.event_type}-${event.event_id}`} className="border-l-2 pl-4"><div className="font-medium">{event.title}</div><div className="text-xs text-gray-500">{event.event_date?new Date(event.event_date).toLocaleString():'—'} · {event.event_type}</div>{event.notes&&<p className="mt-1 text-sm">{event.notes}</p>}{event.result&&<p className="text-sm text-gray-600">Result: {event.result}</p>}</div>)}</div></div>
      <aside className="space-y-4"><Card title="Owner" value={project.profiles?.full_name||'Unassigned'}/><Card title="Company" value={project.companies?.company_name||'—'}/><Card title="Contract No." value={project.contract_number||'—'}/><Card title="Location" value={project.location||'—'}/></aside>
    </section>
    <section className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={addActivity} className="rounded-xl border bg-white p-5 space-y-3"><h2 className="text-xl font-semibold">Add Activity / Follow-up</h2><select className="w-full rounded border p-2" value={activity.activity_type} onChange={e=>setActivity({...activity,activity_type:e.target.value})}>{activityTypes.map(x=><option key={x}>{x}</option>)}</select><input className="w-full rounded border p-2" type="date" value={activity.activity_date} onChange={e=>setActivity({...activity,activity_date:e.target.value})} required/><textarea className="w-full rounded border p-2" placeholder="Notes" value={activity.notes} onChange={e=>setActivity({...activity,notes:e.target.value})}/><input className="w-full rounded border p-2" type="date" value={activity.next_follow_up_date} onChange={e=>setActivity({...activity,next_follow_up_date:e.target.value})}/><input className="w-full rounded border p-2" placeholder="Next action" value={activity.next_action} onChange={e=>setActivity({...activity,next_action:e.target.value})}/><button disabled={saving} className="rounded-lg border px-4 py-2 font-medium">{saving?'Saving...':'Add Activity'}</button></form>
      <form onSubmit={addCollection} className="rounded-xl border bg-white p-5 space-y-3"><h2 className="text-xl font-semibold">Add Collection</h2><input className="w-full rounded border p-2" placeholder="Invoice Number" value={collection.invoice_number} onChange={e=>setCollection({...collection,invoice_number:e.target.value})}/><div className="grid grid-cols-2 gap-2"><input className="rounded border p-2" type="date" value={collection.invoice_date} onChange={e=>setCollection({...collection,invoice_date:e.target.value})}/><input className="rounded border p-2" type="date" value={collection.due_date} onChange={e=>setCollection({...collection,due_date:e.target.value})}/></div><div className="grid grid-cols-2 gap-2"><input className="rounded border p-2" type="number" step="0.01" placeholder="Required Amount" value={collection.required_amount} onChange={e=>setCollection({...collection,required_amount:e.target.value})} required/><input className="rounded border p-2" type="number" step="0.01" placeholder="Collected Amount" value={collection.collected_amount} onChange={e=>setCollection({...collection,collected_amount:e.target.value})}/></div><input className="w-full rounded border p-2" type="date" value={collection.collection_date} onChange={e=>setCollection({...collection,collection_date:e.target.value})}/><textarea className="w-full rounded border p-2" placeholder="Notes" value={collection.notes} onChange={e=>setCollection({...collection,notes:e.target.value})}/><button disabled={saving} className="rounded-lg border px-4 py-2 font-medium">{saving?'Saving...':'Add Collection'}</button></form>
    </section>
  </main>;
}
function Card({title,value}){return <div className="rounded-xl border bg-white p-4"><div className="text-xs uppercase tracking-wide text-gray-500">{title}</div><div className="mt-1 text-lg font-semibold">{value}</div></div>}
