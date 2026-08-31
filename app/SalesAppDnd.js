'use client';

import {useEffect} from 'react';
import SalesApp from './SalesApp';
import {supabase} from '../lib/supabase-browser';

const STAGE_TO_PROJECT={New:'new',Qualified:'pricing_technical',Proposition:'quotation_ready',Won:'won','Lost / Cancelled':'lost'};

export default function SalesAppDnd(){
  useEffect(()=>{
    let dragged=null,activeCol=null;
    const cards=()=>Array.from(document.querySelectorAll('.pipeline-board .deal-card'));
    const cols=()=>Array.from(document.querySelectorAll('.pipeline-board .pipe-col'));
    const start=e=>{const card=e.target.closest('.deal-card');if(!card)return;dragged=card;card.classList.add('is-dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',card.innerText)};
    const end=()=>{if(dragged)dragged.classList.remove('is-dragging');cols().forEach(c=>c.classList.remove('drop-target'));dragged=null;activeCol=null};
    const over=e=>{const col=e.target.closest('.pipe-col');if(!col||!dragged)return;e.preventDefault();cols().forEach(c=>{if(c!==col)c.classList.remove('drop-target')});col.classList.add('drop-target');activeCol=col;e.dataTransfer.dropEffect='move'};
    const drop=async e=>{const col=e.target.closest('.pipe-col');if(!col||!dragged)return;e.preventDefault();const stage=col.querySelector('.pipe-head b')?.textContent?.trim();const name=dragged.querySelector('.deal-card-title')?.textContent?.trim()||dragged.querySelector('b')?.textContent?.trim();const status=STAGE_TO_PROJECT[stage];if(!name||!status)return;try{const {data:rows,error}=await supabase.from('projects').select('id').eq('name',name).limit(2);if(error)throw error;if(rows?.length!==1)throw new Error(rows?.length?'More than one project has this name. Rename the project or use the project page.':'Project not found');const id=rows[0].id;const {error:u}=await supabase.from('projects').update({status}).eq('id',id);if(u)throw u;const pipelineStatus=stage==='Won'?'won':stage==='Lost / Cancelled'?'lost':'active';const {error:p}=await supabase.from('pipeline').update({status:pipelineStatus}).eq('project_id',id);if(p)throw p;window.dispatchEvent(new CustomEvent('pipeline-stage-changed',{detail:{projectId:id,stage}}));window.location.reload()}catch(err){window.alert(`Could not move project: ${err?.message||'Unknown error'}`)}finally{end()}};
    const observe=()=>cards().forEach(c=>{if(c.dataset.dndReady==='1')return;c.dataset.dndReady='1';c.setAttribute('draggable','true')});
    const observer=new MutationObserver(observe);observer.observe(document.body,{childList:true,subtree:true});observe();document.addEventListener('dragstart',start);document.addEventListener('dragend',end);document.addEventListener('dragover',over);document.addEventListener('drop',drop);
    return()=>{observer.disconnect();document.removeEventListener('dragstart',start);document.removeEventListener('dragend',end);document.removeEventListener('dragover',over);document.removeEventListener('drop',drop)};
  },[]);
  return <><style jsx global>{`.deal-card{cursor:grab;transition:transform .15s,box-shadow .15s,opacity .15s}.deal-card:active{cursor:grabbing}.deal-card.is-dragging{opacity:.45;transform:rotate(1deg) scale(.99);box-shadow:0 12px 24px rgba(20,35,61,.14)}.pipe-col.drop-target{background:#e8f1ff;box-shadow:inset 0 0 0 2px #2b70e6}.pipe-col.drop-target .add-deal{color:#1769e0;font-weight:700}`}</style><SalesApp/></>;
}
