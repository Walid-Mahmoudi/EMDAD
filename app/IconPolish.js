'use client';

import {useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {LayoutDashboard,KanbanSquare,Clock3,Building2,FolderKanban,WalletCards,Plus,Search,SlidersHorizontal,ChevronDown,PanelRight,Sun,Moon,Activity,Users,FilePlus2,ReceiptText,Mail,Star,MoreHorizontal} from 'lucide-react';

const icons={
  Dashboard:LayoutDashboard, Pipeline:KanbanSquare, Activities:Clock3, Companies:Building2, Projects:FolderKanban, Collections:WalletCards,
  'Log activity':Activity,'Add company':Users,'New project':FilePlus2, Sales:Activity, Reporting:ReceiptText, Configuration:SlidersHorizontal,
  Filters:SlidersHorizontal, Search:Search, 'View All':PanelRight, 'View Pipeline':KanbanSquare, 'View activities':Activity,
  'Group by: Stage':KanbanSquare
};

function mountIcon(el,Icon){
  let holder=el.querySelector(':scope > .lucide-slot');
  if(!holder){holder=document.createElement('span');holder.className='lucide-slot';holder.setAttribute('aria-hidden','true');el.prepend(holder);}
  if(!holder.__iconRoot) holder.__iconRoot=createRoot(holder);
  holder.__iconRoot.render(<Icon size={16} strokeWidth={1.8}/>);
}

export default function IconPolish(){
 useEffect(()=>{
   const apply=()=>{
     document.querySelectorAll('.sidebar nav button,.sidebar .quick,.top-nav button,.page-actions button,.top-icons button,.panel-head button,.panel-head select').forEach(el=>{
       const text=(el.innerText||'').replace(/[⌕⌄＋◌◫☷]/g,'').trim();
       if(el.matches('.top-icons button')){
         const label=el.getAttribute('aria-label')||'';
         if(el===document.querySelector('.top-icons button:first-child')) mountIcon(el,Plus);
         else if(!el.getAttribute('data-polished')) mountIcon(el,el===document.querySelector('.top-icons button:nth-child(2)')?Sun:PanelRight);
         el.setAttribute('data-polished','1'); return;
       }
       const key=Object.keys(icons).find(k=>text===k || text.startsWith(k+' '));
       if(key){mountIcon(el,icons[key]);el.classList.add('icon-ready');}
     });
     document.querySelectorAll('.deal-foot,.timeline,.activity-icon').forEach(el=>{
       if(el.dataset.iconReady)return;
       el.dataset.iconReady='1';
     });
   };
   apply();
   const observer=new MutationObserver(apply);observer.observe(document.body,{childList:true,subtree:true});
   return()=>observer.disconnect();
 },[]);
 return null;
}
