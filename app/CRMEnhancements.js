'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase-browser';

export default function CRMEnhancements(){
 const [open,setOpen]=useState(false),[projects,setProjects]=useState([]),[busy,setBusy]=useState(false),[msg,setMsg]=useState('');
 const load=async()=>{const {data}=await supabase.from('projects').select('id,name,win_probability,ai_win_probability,sales_win_probability,status,estimated_value').order('name').limit(500);setProjects(data||[])};
 useEffect(()=>{load()},[]);
 useEffect(()=>{
  const nav=document.querySelector('.side nav');
  if(nav && !document.getElementById('sales-inbox-nav')){
   const b=document.createElement('button'); b.id='sales-inbox-nav'; b.innerHTML='<span style="display:flex;align-items:center;gap:10px"><span style="font-size:16px">✉</span><span>Sales Inbox</span></span>'; b.onclick=()=>{window.location.href='/inbox'}; nav.appendChild(b);
  }
 },[open]);
 const update=async(p,value)=>{
  const n=Math.max(0,Math.min(100,Number(value||0)));
  setBusy(true);setMsg('');
  const {error}=await supabase.from('projects').update({sales_win_probability:n,win_probability:n}).eq('id',p.id);
  if(error)setMsg(error.message);else{setProjects(x=>x.map(v=>v.id===p.id?{...v,sales_win_probability:n,win_probability:n}:v));setMsg('Saved — pipeline synced automatically.');}
  setBusy(false);
 };
 return <>
  <button className="probability-fab" onClick={()=>setOpen(true)} title="Sales probability override">%</button>
  {open&&<div className="probability-overlay" onMouseDown={e=>e.target===e.currentTarget&&setOpen(false)}><div className="probability-panel"><div className="probability-head"><div><small>CRM CONTROL</small><h3>Sales probability override</h3><p>Sales override wins over AI and syncs the pipeline at 50%+.</p></div><button onClick={()=>setOpen(false)}>×</button></div><div className="probability-list">{projects.map(p=><div className="probability-row" key={p.id}><div><b>{p.name}</b><span>AI {p.ai_win_probability ?? '—'}% · Current {p.win_probability ?? 0}%</span></div><input type="number" min="0" max="100" defaultValue={p.sales_win_probability ?? p.win_probability ?? 0} disabled={busy} onBlur={e=>update(p,e.target.value)} /></div>)}</div>{msg&&<div className="probability-msg">{msg}</div>}</div></div>}
 </>;
}
