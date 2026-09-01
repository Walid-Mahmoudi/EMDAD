'use client';
import {useEffect} from 'react';

const ORDER=['dashboard','pipeline','projects','activities','companies','collections'];
const LABELS={dashboard:'Overview',pipeline:'Pipeline',projects:'Projects',activities:'Follow-ups',companies:'Companies',collections:'Collections'};
const ORIGINAL={dashboard:'dashboard',pipeline:'pipeline',projects:'projects',activities:'activities',companies:'companies',collections:'collections'};

export default function CRMStructure(){
 useEffect(()=>{
  let observer;
  const apply=()=>{
   const nav=document.querySelector('aside.side nav');
   if(!nav) return false;
   const buttons=[...nav.querySelectorAll(':scope > button')];
   const map={};
   buttons.forEach(b=>{
    const key=b.dataset.crmNav;
    if(key) map[key]=b;
    else {
     const label=b.textContent.trim().toLowerCase();
     const id=ORDER.find(k=>label===ORIGINAL[k]||label===LABELS[k].toLowerCase());
     if(id) map[id]=b;
    }
   });
   if(observer) observer.disconnect();
   ORDER.forEach(id=>{const b=map[id];if(b && nav.lastElementChild!==b) nav.appendChild(b)});
   ORDER.forEach(id=>{const b=map[id];if(b){b.dataset.crmNav=id;const span=b.querySelector('span');if(span && span.textContent!==LABELS[id]) span.textContent=LABELS[id]}});
   const brand=document.querySelector('.brand strong'),sub=document.querySelector('.brand span'),title=document.querySelector('.side-title');
   if(brand && brand.textContent!=='EMDAD CRM') brand.textContent='EMDAD CRM';
   if(sub && sub.textContent!=='Sales workspace') sub.textContent='Sales workspace';
   if(title && title.textContent!=='MAIN') title.textContent='MAIN';
   if(observer) observer.observe(document.body,{childList:true,subtree:true});
   return true;
  };
  if(!apply()) observer=new MutationObserver(apply);
  if(observer) observer.observe(document.body,{childList:true,subtree:true});
  const timer=setTimeout(apply,300);
  return()=>{observer?.disconnect();clearTimeout(timer)};
 },[]);
 return null;
}
