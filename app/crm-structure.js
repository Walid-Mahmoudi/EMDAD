'use client';
import {useEffect} from 'react';
const ORDER=['dashboard','pipeline','projects','activities','companies','collections'];
const LABELS={dashboard:'Overview',pipeline:'Pipeline',projects:'Projects',activities:'Follow-ups',companies:'Companies',collections:'Collections'};
export default function CRMStructure(){
 useEffect(()=>{
  let observer;
  const apply=()=>{
   const nav=document.querySelector('aside.side nav'); if(!nav) return false;
   const buttons=[...nav.querySelectorAll(':scope > button')]; const map={};
   buttons.forEach(b=>{const label=b.textContent.trim().toLowerCase();const id=ORDER.find(k=>label===k||(k==='activities'&&label==='activities'));if(id)map[id]=b});
   ORDER.forEach(id=>{if(map[id])nav.appendChild(map[id])});
   ORDER.forEach(id=>{if(map[id]){const span=map[id].querySelector('span');if(span)span.textContent=LABELS[id]}});
   const brand=document.querySelector('.brand strong'),sub=document.querySelector('.brand span'),title=document.querySelector('.side-title');
   if(brand)brand.textContent='EMDAD CRM'; if(sub)sub.textContent='Sales workspace'; if(title)title.textContent='MAIN'; return true;
  };
  if(!apply())observer=new MutationObserver(apply); if(observer)observer.observe(document.body,{childList:true,subtree:true});
  const timer=setTimeout(apply,300); return()=>{observer?.disconnect();clearTimeout(timer)};
 },[]); return null;
}
