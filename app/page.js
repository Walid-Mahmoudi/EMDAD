'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, CalendarCheck, ChevronLeft, CircleDollarSign, Flame, LayoutDashboard, Menu, Phone, Plus, RefreshCw, Search, Users, X } from 'lucide-react';
import { supabase } from '../lib/supabase-browser';

const nav = [
  ['dashboard', 'Dashboard', LayoutDashboard],
  ['projects', 'Projects', Building2],
  ['pipeline', 'Pipeline', Flame],
  ['activities', 'Activities', CalendarCheck],
  ['companies', 'Companies', Users],
  ['collections', 'Collections', CircleDollarSign],
];

const activityTypes = [
  ['call', 'Call'], ['customer_visit', 'Customer Visit'], ['consultant_visit', 'Consultant Visit'],
  ['meeting', 'Meeting'], ['email', 'Email'], ['follow_up', 'Follow-up'], ['collection_follow_up', 'Collection Follow-up']
];

const emptyProject = { name: '', company_id: '', project_type: '', hvac_scope: '', estimated_value: '', win_probability: '20', temperature: 'cold', status: 'new', source: 'manual', expected_closing_date: '', next_action: '', next_action_date: '', notes: '' };
const emptyActivity = { company_id: '', project_id: '', type: 'call', subject: '', result: '', next_action: '', next_action_date: '', activity_at: new Date().toISOString().slice(0, 16) };

function money(v) { return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(v || 0)); }
function dateLabel(v) { if (!v) return '—'; return new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }

export default function Home() {
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState({ companies: [], projects: [], pipeline: [], activities: [], collections: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mobileNav, setMobileNav] = useState(false);

  async function load() {
    setRefreshing(true); setError('');
    const [companies, projects, pipeline, activities, collections] = await Promise.all([
      supabase.from('companies').select('*').order('name'),
      supabase.from('projects').select('*, companies(name)').order('created_at', { ascending: false }),
      supabase.from('pipeline').select('*, projects(name, companies(name))').order('added_at', { ascending: false }),
      supabase.from('activities').select('*, companies(name), projects(name)').order('activity_at', { ascending: false }),
      supabase.from('collections').select('*, projects(name, companies(name))').order('due_date'),
    ]);
    const firstError = [companies, projects, pipeline, activities, collections].find(x => x.error);
    if (firstError) setError(firstError.error.message);
    setData({ companies: companies.data || [], projects: projects.data || [], pipeline: pipeline.data || [], activities: activities.data || [], collections: collections.data || [] });
    setLoading(false); setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const start = new Date(); start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); start.setHours(0,0,0,0);
    const weekActivities = data.activities.filter(a => new Date(a.activity_at) >= start && a.status === 'completed');
    const activeProjects = data.projects.filter(p => !['won','lost','cancelled'].includes(p.status));
    const hot = activeProjects.filter(p => p.temperature === 'hot');
    return {
      newProjects: data.projects.filter(p => new Date(p.received_at) >= start).length,
      pipelineAdded: data.pipeline.filter(p => new Date(p.added_at) >= start).length,
      hot: hot.length,
      calls: weekActivities.filter(a => a.type === 'call').length,
      visits: weekActivities.filter(a => ['customer_visit','consultant_visit'].includes(a.type)).length,
      consultantVisits: weekActivities.filter(a => a.type === 'consultant_visit').length,
      pipelineValue: data.pipeline.filter(p => p.status === 'active').reduce((s,p) => s + Number(p.value || 0), 0),
      weighted: data.pipeline.filter(p => p.status === 'active').reduce((s,p) => s + Number(p.value || 0) * Number(p.probability || 0) / 100, 0),
      collected: data.collections.reduce((s,c) => s + Number(c.amount_collected || 0), 0),
      remaining: data.collections.reduce((s,c) => s + Math.max(0, Number(c.amount_due || 0) - Number(c.amount_collected || 0)), 0),
    };
  }, [data]);

  function openModal(kind, initial = {}) { setNotice(''); setError(''); setForm(kind === 'project' ? { ...emptyProject, ...initial } : { ...emptyActivity, ...initial }); setModal(kind); }
  function closeModal() { setModal(null); setForm({}); }
  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true); setError('');
    try {
      if (modal === 'project') {
        const payload = { ...form, estimated_value: form.estimated_value ? Number(form.estimated_value) : null, win_probability: Number(form.win_probability || 0), expected_closing_date: form.expected_closing_date || null, next_action_date: form.next_action_date || null };
        const { data: project, error: e } = await supabase.from('projects').insert(payload).select().single();
        if (e) throw e;
        if (Number(project.win_probability) > 50) await supabase.from('pipeline').insert({ project_id: project.id, value: project.estimated_value || 0, probability: project.win_probability, expected_closing_date: project.expected_closing_date });
      } else {
        const payload = { ...form, activity_at: new Date(form.activity_at).toISOString(), next_action_date: form.next_action_date || null, company_id: form.company_id || null, project_id: form.project_id || null };
        const { error: e } = await supabase.from('activities').insert(payload); if (e) throw e;
        if (payload.project_id && payload.next_action_date) await supabase.from('projects').update({ last_follow_up_at: payload.activity_at, next_action: payload.next_action, next_action_date: payload.next_action_date }).eq('id', payload.project_id);
      }
      closeModal(); setNotice('Saved successfully'); await load();
    } catch (e) { setError(e.message || 'Unable to save'); }
    setSaving(false);
  }

  const filteredProjects = data.projects.filter(p => `${p.name} ${p.companies?.name || ''}`.toLowerCase().includes(search.toLowerCase()));
  const filteredCompanies = data.companies.filter(c => `${c.name} ${c.city || ''}`.toLowerCase().includes(search.toLowerCase()));

  return <div className="crm-shell">
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="brand"><span className="brand-mark">E</span><div><strong>EMDAD</strong><small>SALES CRM</small></div></div>
      <nav>{nav.map(([id, label, Icon]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setMobileNav(false); }}><Icon size={18}/><span>{label}</span></button>)}</nav>
      <div className="sidebar-note"><b>Personal Workspace</b><span>Built around your daily HVAC sales workflow.</span></div>
    </aside>

    <section className="main-area">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={22}/></button><div><span className="eyebrow">SALES OPERATING SYSTEM</span><h1>{nav.find(x => x[0] === tab)?.[1] || 'Dashboard'}</h1></div><div className="top-actions"><div className="search-box"><Search size={17}/><input placeholder="Search projects or companies..." value={search} onChange={e => setSearch(e.target.value)}/></div><button className="icon-btn" onClick={load} title="Refresh"><RefreshCw size={18} className={refreshing ? 'spin' : ''}/></button><button className="primary-btn" onClick={() => openModal(tab === 'activities' ? 'activity' : 'project')}><Plus size={18}/> Quick Add</button></div></header>

      <main className="content">
        {error && <div className="alert error">{error}<button onClick={() => setError('')}><X size={16}/></button></div>}
        {notice && <div className="alert success">{notice}</div>}
        {loading ? <div className="empty-state"><RefreshCw className="spin"/><p>Loading CRM...</p></div> : <>
          {tab === 'dashboard' && <Dashboard stats={stats} data={data} onAddActivity={() => openModal('activity')} onAddProject={() => openModal('project')} setTab={setTab}/>} 
          {tab === 'projects' && <Projects projects={filteredProjects} onAdd={() => openModal('project')} setTab={setTab}/>} 
          {tab === 'pipeline' && <Pipeline pipeline={data.pipeline} setTab={setTab}/>} 
          {tab === 'activities' && <Activities activities={data.activities} onAdd={() => openModal('activity')}/>} 
          {tab === 'companies' && <Companies companies={filteredCompanies}/>} 
          {tab === 'collections' && <Collections collections={data.collections} stats={stats}/>} 
        </>}
      </main>
    </section>

    {modal && <Modal title={modal === 'project' ? 'New Project' : 'Log Activity'} onClose={closeModal} onSave={save} saving={saving}>
      {modal === 'project' ? <ProjectForm form={form} setField={setField} companies={data.companies}/> : <ActivityForm form={form} setField={setField} companies={data.companies} projects={data.projects}/>} 
    </Modal>}
  </div>;
}

function Dashboard({ stats, data, onAddActivity, onAddProject, setTab }) {
  const due = data.projects.filter(p => p.next_action_date && new Date(p.next_action_date) <= new Date()).slice(0,5);
  const hot = data.projects.filter(p => p.temperature === 'hot' && !['won','lost','cancelled'].includes(p.status)).slice(0,5);
  return <>
    <div className="welcome"><div><span className="eyebrow">MONDAY, SALES COMMAND CENTER</span><h2>Good day. Here is what needs your attention.</h2><p>Keep projects moving, follow-ups visible, and your weekly numbers ready.</p></div><div className="welcome-actions"><button className="secondary-btn" onClick={onAddActivity}><Phone size={17}/> Log activity</button><button className="primary-btn" onClick={onAddProject}><Plus size={17}/> New project</button></div></div>
    <div className="stats-grid">
      <Stat title="New Projects" value={stats.newProjects} sub="this week" icon={Building2}/><Stat title="Pipeline Added" value={stats.pipelineAdded} sub="this week" icon={Flame}/><Stat title="Hot Projects" value={stats.hot} sub="active now" icon={Flame} hot/><Stat title="Calls" value={stats.calls} sub="this week" icon={Phone}/><Stat title="Consultant Visits" value={stats.consultantVisits} sub="this week" icon={Users}/>
    </div>
    <div className="grid-2">
      <section className="card"><div className="card-head"><div><span className="eyebrow">ATTENTION</span><h3>My Follow-ups</h3></div><button className="link-btn" onClick={() => setTab('projects')}>View projects <ChevronLeft size={15}/></button></div>{due.length ? <div className="list">{due.map(p => <div className="list-row" key={p.id}><div><b>{p.name}</b><span>{p.companies?.name || 'No company'} · {p.next_action || 'Follow-up'}</span></div><strong className="overdue">{dateLabel(p.next_action_date)}</strong></div>)}</div> : <Empty text="No follow-ups due. Nice."/>}</section>
      <section className="card"><div className="card-head"><div><span className="eyebrow">PRIORITY</span><h3>Hot Projects</h3></div><button className="link-btn" onClick={() => setTab('pipeline')}>Open pipeline <ChevronLeft size={15}/></button></div>{hot.length ? <div className="list">{hot.map(p => <div className="list-row" key={p.id}><div><b>{p.name}</b><span>{p.companies?.name || 'No company'}</span></div><strong>{money(p.estimated_value)} EGP</strong></div>)}</div> : <Empty text="No hot projects yet."/>}</section>
    </div>
    <div className="stats-wide"><Metric label="Active Pipeline" value={`${money(stats.pipelineValue)} EGP`} note={`Weighted ${money(stats.weighted)} EGP`}/><Metric label="Collected" value={`${money(stats.collected)} EGP`} note="All collections"/><Metric label="Remaining" value={`${money(stats.remaining)} EGP`} note="Open receivables"/></div>
  </>;
}

function Stat({ title, value, sub, icon: Icon, hot }) { return <div className="stat-card"><div className={`stat-icon ${hot ? 'hot' : ''}`}><Icon size={19}/></div><span>{title}</span><strong>{value}</strong><small>{sub}</small></div>; }
function Metric({label,value,note}) { return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }
function Empty({text}) { return <div className="empty-mini">{text}</div>; }

function Projects({ projects, onAdd, setTab }) { return <section className="card"><div className="card-head"><div><span className="eyebrow">OPPORTUNITIES</span><h3>Projects</h3></div><button className="primary-btn" onClick={onAdd}><Plus size={17}/> New project</button></div><div className="table-wrap"><table><thead><tr><th>Project</th><th>Company</th><th>Stage</th><th>Temperature</th><th>Value</th><th>Next Action</th></tr></thead><tbody>{projects.length ? projects.map(p => <tr key={p.id}><td><b>{p.name}</b><small>{p.project_type || 'HVAC project'}</small></td><td>{p.companies?.name || '—'}</td><td><span className="pill">{p.status.replaceAll('_',' ')}</span></td><td><span className={`temp ${p.temperature}`}>{p.temperature}</span></td><td>{money(p.estimated_value)} EGP</td><td>{p.next_action ? <><b>{p.next_action}</b><small>{dateLabel(p.next_action_date)}</small></> : '—'}</td></tr>) : <tr><td colSpan="6"><Empty text="No projects yet. Add your first project."/></td></tr>}</tbody></table></div></section>; }

function Pipeline({ pipeline, setTab }) { const cols=['active','won','lost','on_hold']; const labels={active:'Active',won:'Won',lost:'Lost',on_hold:'On Hold'}; return <div className="kanban">{cols.map(col => <section className="kanban-col" key={col}><div className="kanban-head"><b>{labels[col]}</b><span>{pipeline.filter(p=>p.status===col).length}</span></div>{pipeline.filter(p=>p.status===col).map(p => <div className="deal-card" key={p.id}><span className={`temp ${p.projects?.temperature || 'cold'}`}>{p.projects?.temperature || 'cold'}</span><h4>{p.projects?.name || 'Project'}</h4><p>{p.projects?.companies?.name || '—'}</p><strong>{money(p.value)} EGP</strong><small>{Number(p.probability || 0)}% probability · {dateLabel(p.expected_closing_date)}</small></div>)}</section>)}</div>; }

function Activities({ activities, onAdd }) { return <section className="card"><div className="card-head"><div><span className="eyebrow">SALES ACTIVITY</span><h3>Calls, visits & meetings</h3></div><button className="primary-btn" onClick={onAdd}><Plus size={17}/> Log activity</button></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Company</th><th>Project</th><th>Result</th><th>Next Action</th></tr></thead><tbody>{activities.length ? activities.slice(0,50).map(a => <tr key={a.id}><td>{dateLabel(a.activity_at)}</td><td><span className="pill">{a.type.replaceAll('_',' ')}</span></td><td>{a.companies?.name || '—'}</td><td>{a.projects?.name || 'General'}</td><td>{a.result || '—'}</td><td>{a.next_action ? <><b>{a.next_action}</b><small>{dateLabel(a.next_action_date)}</small></> : '—'}</td></tr>) : <tr><td colSpan="6"><Empty text="No activities recorded yet."/></td></tr>}</tbody></table></div></section>; }

function Companies({ companies }) { return <section className="card"><div className="card-head"><div><span className="eyebrow">ACCOUNTS</span><h3>Companies</h3></div></div><div className="company-grid">{companies.length ? companies.map(c => <div className="company-card" key={c.id}><div className="company-avatar"><Building2 size={18}/></div><div><b>{c.name}</b><span>{c.company_type} · {c.city || 'Egypt'}</span><small>{c.phone || c.email || 'No contact details'}</small></div></div>) : <Empty text="No companies yet."/>}</div></section>; }
function Collections({ collections, stats }) { return <><div className="stats-wide"><Metric label="Collected" value={`${money(stats.collected)} EGP`} note="Recorded payments"/><Metric label="Remaining" value={`${money(stats.remaining)} EGP`} note="Amount still due"/></div><section className="card"><div className="card-head"><div><span className="eyebrow">CASH FLOW</span><h3>Collections</h3></div></div><div className="table-wrap"><table><thead><tr><th>Project</th><th>Due Date</th><th>Due</th><th>Collected</th><th>Status</th><th>Next Follow-up</th></tr></thead><tbody>{collections.length ? collections.map(c => <tr key={c.id}><td><b>{c.projects?.name || '—'}</b><small>{c.projects?.companies?.name || ''}</small></td><td>{dateLabel(c.due_date)}</td><td>{money(c.amount_due)} EGP</td><td>{money(c.amount_collected)} EGP</td><td><span className="pill">{c.status.replaceAll('_',' ')}</span></td><td>{dateLabel(c.next_follow_up_date)}</td></tr>) : <tr><td colSpan="6"><Empty text="No collections recorded yet."/></td></tr>}</tbody></table></div></section></>; }

function Modal({ title, onClose, onSave, saving, children }) { return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><h3>{title}</h3><button onClick={onClose}><X size={19}/></button></div><div className="modal-body">{children}</div><div className="modal-foot"><button className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div></div></div>; }
function Field({label,children}) { return <label className="field"><span>{label}</span>{children}</label>; }
function ProjectForm({form,setField,companies}) { return <div className="form-grid"><Field label="Project Name"><input value={form.name} onChange={e=>setField('name',e.target.value)} placeholder="e.g. New Hospital HVAC"/></Field><Field label="Company"><select value={form.company_id} onChange={e=>setField('company_id',e.target.value)}><option value="">Select company</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="Estimated Value (EGP)"><input type="number" value={form.estimated_value} onChange={e=>setField('estimated_value',e.target.value)}/></Field><Field label="Win Probability %"><input type="number" min="0" max="100" value={form.win_probability} onChange={e=>setField('win_probability',e.target.value)}/></Field><Field label="Temperature"><select value={form.temperature} onChange={e=>setField('temperature',e.target.value)}><option value="cold">Cold</option><option value="warm">Warm</option><option value="hot">Hot</option></select></Field><Field label="Project Type"><input value={form.project_type} onChange={e=>setField('project_type',e.target.value)} placeholder="VRF / Chiller / AHU..."/></Field><Field label="Expected Closing"><input type="date" value={form.expected_closing_date} onChange={e=>setField('expected_closing_date',e.target.value)}/></Field><Field label="Next Action Date"><input type="date" value={form.next_action_date} onChange={e=>setField('next_action_date',e.target.value)}/></Field><Field label="Next Action"><input value={form.next_action} onChange={e=>setField('next_action',e.target.value)} placeholder="Follow up quotation"/></Field><Field label="HVAC Scope"><input value={form.hvac_scope} onChange={e=>setField('hvac_scope',e.target.value)} placeholder="VRF, Chillers, Package..."/></Field><Field label="Notes" wide><textarea rows="3" value={form.notes} onChange={e=>setField('notes',e.target.value)}/></Field></div>; }
function ActivityForm({form,setField,companies,projects}) { return <div className="form-grid"><Field label="Activity Type"><select value={form.type} onChange={e=>setField('type',e.target.value)}>{activityTypes.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field><Field label="Date & Time"><input type="datetime-local" value={form.activity_at} onChange={e=>setField('activity_at',e.target.value)}/></Field><Field label="Company"><select value={form.company_id} onChange={e=>setField('company_id',e.target.value)}><option value="">General activity</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="Project"><select value={form.project_id} onChange={e=>setField('project_id',e.target.value)}><option value="">No specific project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="Subject" wide><input value={form.subject} onChange={e=>setField('subject',e.target.value)} placeholder="What happened?"/></Field><Field label="Result" wide><textarea rows="3" value={form.result} onChange={e=>setField('result',e.target.value)} placeholder="Client response / meeting outcome..."/></Field><Field label="Next Action"><input value={form.next_action} onChange={e=>setField('next_action',e.target.value)} placeholder="Call client / send revision"/></Field><Field label="Next Action Date"><input type="date" value={form.next_action_date} onChange={e=>setField('next_action_date',e.target.value)}/></Field></div>; }
