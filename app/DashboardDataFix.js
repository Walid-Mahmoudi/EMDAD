'use client';
import {useEffect} from 'react';
import {supabase} from '../lib/supabase-browser';

const money=v=>new Intl.NumberFormat('en-EG',{maximumFractionDigits:0}).format(Number(v||0));
const weekStart=()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d};

function setText(el,value){if(el&&el.textContent!==String(value))el.textContent=String(value)}
function setSmall(el,value){if(el){el.textContent=String(value);el.style.opacity='1'}}

export default function DashboardDataFix(){
 useEffect(()=>{
  let cancelled=false;
  const refresh=async()=>{
   const [{data:projects,error:pErr},{data:pipeline,error:pipeErr},{data:collections,error:cErr},{data:activities,error:aErr}]=await Promise.all([
    supabase.from('projects').select('id,name,estimated_value,status,temperature,win_probability,created_at'),
    supabase.from('pipeline').select('id,value,probability,status,project_id'),
    supabase.from('collections').select('amount_due,amount_collected'),
    supabase.from('activities').select('type,status,activity_at').eq('status','completed').gte('activity_at',weekStart().toISOString())
   ]);
   if(cancelled||pErr||pipeErr||cErr||aErr)return;
   const p=projects||[],pipe=pipeline||[],c=collections||[],a=activities||[];
   const active=p.filter(x=>!['won','lost','cancelled'].includes(x.status));
   const hot=active.filter(x=>x.temperature==='hot');
   const estimated=active.reduce((s,x)=>s+Number(x.estimated_value||0),0);
   const won=p.filter(x=>x.status==='won').reduce((s,x)=>s+Number(x.estimated_value||0),0);
   const pipelineValue=pipe.reduce((s,x)=>s+Number(x.value||0),0);
   const collected=c.reduce((s,x)=>s+Number(x.amount_collected||0),0);
   const remaining=c.reduce((s,x)=>s+Math.max(0,Number(x.amount_due||0)-Number(x.amount_collected||0)),0);
   const calls=a.filter(x=>x.type==='call').length;
   const visits=a.filter(x=>['customer_visit','consultant_visit'].includes(x.type)).length;
   const newProjects=p.filter(x=>x.created_at&&new Date(x.created_at)>=weekStart()).length;
   const stats=document.querySelectorAll('.stats .stat');
   if(stats.length>=4){
    setText(stats[0].querySelector('b'),estimated?`EGP ${money(estimated)}`:'Value pending');
    setSmall(stats[0].querySelector('small'),estimated?`${active.length} active opportunities`:`${active.length} active projects · values not set`);
    setText(stats[1].querySelector('b'),won?`EGP ${money(won)}`:'EGP 0');
    setSmall(stats[1].querySelector('small'),'Closed revenue');
    setText(stats[2].querySelector('b'),pipelineValue?`EGP ${money(pipelineValue)}`:'EGP 0');
    setSmall(stats[2].querySelector('small'),`${pipe.length} pipeline deal${pipe.length===1?'':'s'}`);
    setText(stats[3].querySelector('b'),hot.length);
    setSmall(stats[3].querySelector('small'),`${hot.length} hot project${hot.length===1?'':'s'} need attention`);
   }
   const metrics=document.querySelectorAll('.overview .metrics>div');
   if(metrics.length>=4){
    setText(metrics[0].querySelector('b'),newProjects);setSmall(metrics[0].querySelector('small'),'this week');
    setText(metrics[1].querySelector('b'),calls);setSmall(metrics[1].querySelector('small'),'this week');
    setText(metrics[2].querySelector('b'),visits);setSmall(metrics[2].querySelector('small'),'this week');
    setText(metrics[3].querySelector('b'),`EGP ${money(collected)}`);setSmall(metrics[3].querySelector('small'),c.length?'recorded':'No collections recorded');
   }
   const hotRows=document.querySelectorAll('.overview ~ .panel .op-row');
   hotRows.forEach((row,i)=>{const item=hot[i];if(item){setText(row.querySelector('strong'),item.estimated_value?`EGP ${money(item.estimated_value)}`:'Value pending')}});
   const cash=document.querySelectorAll('.cash .cash-card');
   if(cash.length>=3){
    setText(cash[0].querySelector('b'),`EGP ${money(pipelineValue)}`);setText(cash[0].querySelector('span'),`Active pipeline · ${pipe.length} deal${pipe.length===1?'':'s'}`);
    setText(cash[1].querySelector('b'),`EGP ${money(collected)}`);setText(cash[2].querySelector('b'),`EGP ${money(remaining)}`);
   }
  };
  refresh();
  const timer=setInterval(refresh,30000);
  return()=>{cancelled=true;clearInterval(timer)};
 },[]);
 return null;
}
