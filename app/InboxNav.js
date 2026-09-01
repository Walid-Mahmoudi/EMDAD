'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Mail } from 'lucide-react';
import './inbox-nav.css';

export default function InboxNav(){
  const [host,setHost]=useState(null);
  useEffect(()=>{
    let mount=null;
    let observer=null;
    const attach=()=>{
      const nav=document.querySelector('aside.sidebar nav');
      if(!nav || mount) return !!nav;
      mount=document.createElement('div');
      mount.className='inbox-nav-mount';
      nav.appendChild(mount);
      setHost(mount);
      observer?.disconnect();
      return true;
    };
    if(!attach()){
      observer=new MutationObserver(()=>attach());
      observer.observe(document.body,{childList:true,subtree:true});
    }
    return ()=>{observer?.disconnect();mount?.remove();};
  },[]);
  if(!host) return null;
  return createPortal(
    <a href="/inbox" className="inbox-nav-link" aria-label="Sales Inbox">
      <Mail size={17} strokeWidth={1.8}/><span>Sales Inbox</span><span className="inbox-badge">Inbox</span>
    </a>,host
  );
}
