'use client';
import {useState} from 'react';
import {Mail,RefreshCw,CheckCircle2,AlertTriangle} from 'lucide-react';

export default function EmailSyncPanel(){
  const [busy,setBusy]=useState(false);
  const [result,setResult]=useState(null);
  const [error,setError]=useState('');
  async function sync(){
    setBusy(true); setError(''); setResult(null);
    try{
      const res=await fetch('/api/email/sync',{method:'POST'});
      const data=await res.json();
      if(!res.ok || !data.ok) throw new Error(data.error || data.message || 'Email sync failed');
      setResult(data);
      setTimeout(()=>window.location.reload(),2500);
    }catch(e){setError(e.message || 'Email sync failed');}
    finally{setBusy(false);}
  }
  return <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,margin:'0 0 16px',padding:'13px 15px',border:'1px solid #dfe6ef',borderRadius:12,background:'#fff'}}>
    <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
      <div style={{width:34,height:34,borderRadius:9,display:'grid',placeItems:'center',background:'#eef4ff',color:'#1769e8'}}><Mail size={17}/></div>
      <div style={{minWidth:0}}><b style={{display:'block',fontSize:13,color:'#1a2941'}}>Email intake</b><span style={{display:'block',fontSize:11,color:'#7a879a',marginTop:2}}>Read the latest messages from mail.emdad.net and add them to the inbox.</span></div>
    </div>
    <button onClick={sync} disabled={busy} style={{border:0,borderRadius:9,padding:'10px 14px',background:'#1769e8',color:'#fff',fontWeight:800,display:'inline-flex',alignItems:'center',gap:8,cursor:busy?'not-allowed':'pointer',whiteSpace:'nowrap',opacity:busy?.65:1}}><RefreshCw size={15} style={busy?{animation:'spin 0.8s linear infinite'}:undefined}/>{busy?'Syncing…':'Sync email'}</button>
    {result&&<div style={{display:'flex',alignItems:'center',gap:7,color:'#087443',fontSize:11,fontWeight:700}}><CheckCircle2 size={15}/> Scanned {result.scanned} · New {result.inserted} · Existing {result.skipped}</div>}
    {error&&<div style={{display:'flex',alignItems:'center',gap:7,color:'#b42318',fontSize:11,fontWeight:700}}><AlertTriangle size={15}/> {error}</div>}
    <style jsx>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;
}
