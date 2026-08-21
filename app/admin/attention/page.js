'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AttentionCenter(){
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{const supabase=createClient(); const {data}=await supabase.from('crm_attention_center').select('*').order('attention_date',{ascending:true});setItems(data||[]);setLoading(false)})()},[]);
  const labels={overdue_followup:'Overdue Follow-up',today_followup:'Today',overdue_collection:'Overdue Collection',missing_next_followup:'Missing Follow-up',closing_soon:'Closing Soon',high_value_inactive:'High Value / Inactive'};
  return <main className="p-6 space-y-6"><div><p className="text-sm text-gray-500">Management</p><h1 className="text-3xl font-semibold">Attention Center</h1><p className="text-gray-600">Live operational items requiring attention.</p></div>{loading?<p>Loading...</p>:<div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Type</th><th className="p-3">Title</th><th className="p-3">Date</th><th className="p-3">Project</th><th className="p-3">Notes</th></tr></thead><tbody>{items.map(x=><tr key={`${x.attention_type}-${x.reference_id}`} className="border-b last:border-0"><td className="p-3 font-medium">{labels[x.attention_type]||x.attention_type}</td><td className="p-3">{x.title}</td><td className="p-3">{x.attention_date?new Date(x.attention_date).toLocaleString():'—'}</td><td className="p-3">{x.project_id||'—'}</td><td className="p-3">{x.notes||'—'}</td></tr>)}</tbody></table>{items.length===0&&<p className="p-6 text-gray-500">No attention items.</p>}</div>}</main>;
}
