'use client';

import {useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {LayoutDashboard,KanbanSquare,Clock3,Building2,FolderKanban,WalletCards,Plus,Search,SlidersHorizontal,PanelRight,Sun,Activity,Users,FilePlus2,ReceiptText} from 'lucide-react';

const icons={Dashboard:LayoutDashboard,Pipeline:KanbanSquare,Activities:Clock3,Companies:Building2,Projects:FolderKanban,Collections:WalletCards,'Log activity':Activity,'Add company':Users,'New project':FilePlus2,Sales:Activity,Reporting:ReceiptText,Configuration:SlidersHorizontal,Filters:SlidersHorizontal,Search:Search,'View All':PanelRight,'View Pipeline':KanbanSquare,'View activities':Activity,'Group by: Stage':KanbanSquare};

function cleanSymbols(el){
  el.childNodes.forEach(n=>{if(n.nodeType===Node.TEXT_NODE)n.nodeValue=n.nodeValue.replace(/[⌕⌄＋◌◫☷▦◷▤□◉]/g,'')});
}
function mountIcon(el,Icon){
  let holder=el.querySelector(':scope > .lucide-slot');
  if(!holder){holder=document.createElement('span');holder.className='lucide-slot';holder.setAttribute('aria-hidden','true');el.prepend(holder)}
  if(!holder.__iconRoot)holder.__iconRoot=createRoot(holder);
  holder.__iconRoot.render(<Icon size={16} strokeWidth={1.8}/>);
}

export default function IconPolish(){
 useEffect(()=>{
   const apply=()=>{
     document.querySelectorAll('.sidebar nav button,.sidebar .quick,.top-nav button,.page-actions button,.top-icons button,.panel-head button').forEach(el=>{
       cleanSymbols(el);
       if(el.matches('.top-icons button')){
         const buttons=document.querySelectorAll('.top-icons button');
         const idx=Array.from(buttons).indexOf(el);
         mountIcon(el,idx===0?Plus:idx===1?Sun:PanelRight);
         el.setAttribute('aria-label',idx===0?'New project':idx===1?'Theme': 'Layout');
         return;
       }
       const text=(el.innerText||'').trim();
       const key=Object.keys(icons).find(k=>text===k||text.startsWith(k+' '));
       if(key){mountIcon(el,icons[key]);el.classList.add('icon-ready')}
     });
   };
   apply();
   const observer=new MutationObserver(apply);observer.observe(document.body,{childList:true,subtree:true});
   return()=>observer.disconnect();
 },[]);
 return null;
}
