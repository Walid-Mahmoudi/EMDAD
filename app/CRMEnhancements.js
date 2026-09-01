'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase-browser';

const stages=[['new','New'],['pricing_technical','Qualified'],['quotation_ready','Proposition'],['quotation_sent','Proposal sent'],['follow_up','Follow-up'],['negotiation','Negotiation'],['won','Won'],['lost','Lost'],['on_hold','On hold'],['cancelled','Cancelled']];
const temps=['cold','warm','hot'];

export default function CRMEnhancements(){
 const [open,setOpen]=useState(false),[mode,setMode]=useState('projects'),[projects,setProjects]=useState([]),[busy,setBusy]=useState(false),[msg,setMsg]=useState(''),[editing,setEditing]=useState(null),[draft,setDraft]=useState({}),[projectsPage,setProjectsPage]=useState(false);
 const load=async()=>{const {data}=await supabase.from('projects').select('id,name,company_id,win_probability,ai_win_probability,sales_win_probability,status,temperature,estimated_value,next_action,next_action_date').order('name').limit(500);setProjects(data||[])};
 useEffect(()=>{load()},[]);
 useEffect(()=>{
  const check=()=>{const selected=[...document.querySelectorAll('.side nav button.selected')].some(b=>(b.textContent||'').trim()==='Projects');setProjectsPage(selected);if(!selected)setOpen(false)};
  check();const observer=new MutationObserver(check);observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  if(!projectsPage)return;
  const inject=()=>{
   document.querySelectorAll('.table-panel tbody tr').forEach(row=>{
    if(row.querySelector('.inline-project-edit'))return;
    const name=(row.querySelector('td b')?.textContent||'').trim();
    const project=projects.find(p=>p.name===name);
    if(!project)return;
    const cell=document.createElement('td');cell.className='inline-edit-cell';
    const btn=document.createElement('button');btn.className='inline-project-edit';btn.textContent='Edit';
    btn.onclick=()=>startEdit(project);
    cell.appendChild(btn);row.appendChild(cell);
   });
  };
  inject();const observer=new MutationObserver(inject);observer.observe(document.body,{subtree:true,childList:true});return()=>observer.disconnect();
 },[projectsPage,projects]);
 const updateProbability=async(p,value)=>{
  const n=Math.max(0,Math.min(100,Number(value||0)));setBusy(true);setMsg('');
  const {error}=await supabase.from('projects').update({sales_win_probability:n,win_probability:n}).eq('id',p.id);
  if(error)setMsg(error.message);else{setProjects(x=>x.map(v=>v.id===p.id?{...v,sales_win_probability:n,win_probability:n}:v));setMsg('Saved — pipeline synced automatically.');}
  setBusy(false);
 };
 const startEdit=p=>{setOpen(true);setMode('projects');setEditing(p.id);setDraft({name:p.name,estimated_value:p.estimated_value??'',win_probability:p.sales_win_probability??p.win_probability??0,temperature:p.temperature||'cold',status:p.status||'new',next_action:p.next_action||'',next_action_date:p.next_action_date||''});setMsg('')};
 const saveEdit=async()=>{
  if(!editing)return;setBusy(true);setMsg('');
  const n=Math.max(0,Math.min(100,Number(draft.win_probability||0)));
  const payload={name:draft.name,estimated_value:draft.estimated_value===''?null:Number(draft.estimated_value),sales_win_probability:n,win_probability:n,temperature:draft.temperature,status:draft.status,next_action:draft.next_action||null,next_action_date:draft.next_action_date||null};
  const {error}=await supabase.from('projects').update(payload).eq('id',editing);
  if(error)setMsg(error.message);else{setProjects(x=>x.map(p=>p.id===editing?{...p,...payload}:p));setEditing(null);setMsg('Project saved — pipeline status synchronized.');}
  setBusy(false);
 };
 return <>
  {projectsPage&&<button className="probability-fab project-manager-fab" onClick={()=>{setOpen(true);setMode('projects');setEditing(null);load()}} title="Manage projects">Manage Projects</button>}
  {open&&<div className="probability-overlay" onMouseDown={e=>e.target===e.currentTarget&&setOpen(false)}><div className="probability-panel crm-control-panel">
   <div className="probability-head"><div><small>PROJECT MANAGEMENT</small><h3>{editing?'Edit project':'Edit projects'}</h3><p>Update project value, probability, temperature, stage and next action.</p></div><button onClick={()=>setOpen(false)}>×</button></div>
   <div className="crm-control-tabs"><button className={mode==='projects'?'active':''} onClick={()=>{setMode('projects');setEditing(null)}}>Projects</button><button className={mode==='probability'?'active':''} onClick={()=>{setMode('probability');setEditing(null)}}>Probability</button></div>
   {mode==='probability'&&<div className="probability-list">{projects.map(p=><div className="probability-row" key={p.id}><div><b>{p.name}</b><span>AI {p.ai_win_probability ?? '—'}% · Current {p.win_probability ?? 0}% · {p.status}</span></div><input type="number" min="0" max="100" defaultValue={p.sales_win_probability ?? p.win_probability ?? 0} disabled={busy} onBlur={e=>updateProbability(p,e.target.value)}/></div>)}</div>}
   {mode==='projects'&&<div className="project-control-list">{projects.map(p=>editing===p.id?<div className="project-edit-card" key={p.id}>
      <b>Edit project</b><label>Project name<input value={draft.name||''} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><div className="project-edit-grid"><label>Value<input type="number" value={draft.estimated_value} onChange={e=>setDraft({...draft,estimated_value:e.target.value})}/></label><label>Probability %<input type="number" min="0" max="100" value={draft.win_probability} onChange={e=>setDraft({...draft,win_probability:e.target.value})}/></label></div><div className="project-edit-grid"><label>Temperature<select value={draft.temperature} onChange={e=>setDraft({...draft,temperature:e.target.value})}>{temps.map(x=><option key={x} value={x}>{x}</option>)}</select></label><label>Stage<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}>{stages.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label></div><label>Next action<input value={draft.next_action||''} onChange={e=>setDraft({...draft,next_action:e.target.value})}/></label><label>Next action date<input type="date" value={draft.next_action_date||''} onChange={e=>setDraft({...draft,next_action_date:e.target.value})}/></label><div className="project-edit-actions"><button onClick={()=>setEditing(null)}>Cancel</button><button className="primary" disabled={busy||!draft.name} onClick={saveEdit}>{busy?'Saving…':'Save changes'}</button></div>
    </div>:<div className="project-control-row" key={p.id}><div><b>{p.name}</b><span>{p.status} · {p.temperature} · {p.win_probability||0}% · EGP {Number(p.estimated_value||0).toLocaleString('en-EG')}</span></div><button onClick={()=>startEdit(p)}>Edit</button></div>)}</div>}
   {msg&&<div className="probability-msg">{msg}</div>}
  </div></div>}
 </>;
}
