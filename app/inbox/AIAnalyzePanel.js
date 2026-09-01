'use client';
import {useState} from 'react';
import {Bot,RefreshCw,CheckCircle2,AlertTriangle} from 'lucide-react';

export default function AIAnalyzePanel(){
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  async function analyze(){
    setBusy(true); setMessage(''); setError('');
    try{
      const res=await fetch('/api/email/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({limit:25})});
      const data=await res.json();
      if(!res.ok || !data.ok) throw new Error(data.error || 'AI analysis failed');
      setMessage(`Analyzed ${data.analyzed} · Failed ${data.failed}`);
      setTimeout(()=>window.location.reload(),1200);
    }catch(e){setError(e.message || 'AI analysis failed');}
    finally{setBusy(false)}
  }
  return <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,margin:'0 0 16px',padding:'13px 15px',border:'1px solid #dfe6ef',borderRadius:12,background:'#fff'}}>
    <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
      <div style={{width:34,height:34,borderRadius:9,display:'grid',placeItems:'center',background:'#f1ecff',color:'#6d3df5'}}><Bot size={17}/></div>
      <div style={{minWidth:0}}><b style={{display:'block',fontSize:13,color:'#1a2941'}}>AI project extraction</b><span style={{display:'block',fontSize:11,color:'#7a879a',marginTop:2}}>Analyze up to 25 new requests and extract CRM-ready project data.</span></div>
    </div>
    <button onClick={analyze} disabled={busy} style={{border:0,borderRadius:9,padding:'10px 14px',background:'#6d3df5',color:'#fff',fontWeight:800,display:'inline-flex',alignItems:'center',gap:8,cursor:busy?'not-allowed':'pointer',whiteSpace:'nowrap',opacity:busy?.65:1}}><RefreshCw size={15} style={busy?{animation:'spin .8s linear infinite'}:undefined}/>{busy?'Analyzing…':'Analyze with AI'}</button>
    {message&&<div style={{display:'flex',alignItems:'center',gap:7,color:'#087443',fontSize:11,fontWeight:700}}><CheckCircle2 size={15}/>{message}</div>}
    {error&&<div style={{display:'flex',alignItems:'center',gap:7,color:'#b42318',fontSize:11,fontWeight:700}}><AlertTriangle size={15}/>{error}</div>}
    <style jsx>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;
}
