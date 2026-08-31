'use client';

import {useEffect} from 'react';
import SalesApp from './SalesApp';
import {supabase} from '../lib/supabase-browser';

const STAGE_TO_PROJECT={
  New:'new',
  Qualified:'pricing_technical',
  Proposition:'quotation_ready',
  Won:'won',
  'Lost / Cancelled':'lost'
};

export default function SalesAppDnd(){
  useEffect(()=>{
    let dragged=null;
    let activeCol=null;
    const getCards=()=>Array.from(document.querySelectorAll('.pipeline-board .deal-card'));
    const getColumns=()=>Array.from(document.querySelectorAll('.pipeline-board .pipe-col'));

    const onDragStart=e=>{
      const card=e.target.closest('.deal-card');
      if(!card)return;
      dragged=card;
      card.classList.add('is-dragging');
      e.dataTransfer.effectAllowed='move';
      e.dataTransfer.setData('text/plain',card.innerText);
    };
    const onDragEnd=()=>{
      if(dragged)dragged.classList.remove('is-dragging');
      getColumns().forEach(c=>c.classList.remove('drop-target'));
      dragged=null;activeCol=null;
    };
    const onDragOver=e=>{
      const col=e.target.closest('.pipe-col');
      if(!col||!dragged)return;
      e.preventDefault();
      if(activeCol!==col){getColumns().forEach(c=>c.classList.remove('drop-target'));col.classList.add('drop-target');activeCol=col;}
      e.dataTransfer.dropEffect='move';
    };
    const onDrop=async e=>{
      const col=e.target.closest('.pipe-col');
      if(!col||!dragged)return;
      e.preventDefault();
      const stage=col.querySelector('.pipe-head b')?.textContent?.trim();
      const projectName=dragged.querySelector('b')?.textContent?.trim();
      const projectStatus=STAGE_TO_PROJECT[stage];
      if(!projectName||!projectStatus)return;
      col.classList.remove('drop-target');
      try{
        const {data:rows,error}=await supabase.from('projects').select('id,status').eq('name',projectName).limit(2);
        if(error)throw error;
        if(!rows?.length)throw new Error('Project not found');
        const project=rows[0];
        const {error:updateError}=await supabase.from('projects').update({status:projectStatus}).eq('id',project.id);
        if(updateError)throw updateError;
        const pipelineStatus=stage==='Won'?'won':stage==='Lost / Cancelled'?'lost':'active';
        const {error:pipelineError}=await supabase.from('pipeline').update({status:pipelineStatus}).eq('project_id',project.id);
        if(pipelineError && !String(pipelineError.message||'').toLowerCase().includes('no rows'))throw pipelineError;
        window.dispatchEvent(new CustomEvent('pipeline-stage-changed',{detail:{projectId:project.id,stage}}));
        setTimeout(()=>window.location.reload(),150);
      }catch(err){
        window.alert(`Could not move project: ${err?.message||'Unknown error'}`);
      }finally{onDragEnd();}
    };

    const observe=()=>{
      getCards().forEach(card=>{
        if(card.dataset.dndReady==='1')return;
        card.dataset.dndReady='1';
        card.setAttribute('draggable','true');
      });
    };
    const observer=new MutationObserver(observe);
    observer.observe(document.body,{childList:true,subtree:true});
    observe();
    document.addEventListener('dragstart',onDragStart);
    document.addEventListener('dragend',onDragEnd);
    document.addEventListener('dragover',onDragOver);
    document.addEventListener('drop',onDrop);
    return()=>{observer.disconnect();document.removeEventListener('dragstart',onDragStart);document.removeEventListener('dragend',onDragEnd);document.removeEventListener('dragover',onDragOver);document.removeEventListener('drop',onDrop)};
  },[]);

  return <SalesApp/>;
}
