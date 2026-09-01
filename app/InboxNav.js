'use client';

import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {Mail} from 'lucide-react';

export default function InboxNav(){
  const [host,setHost]=useState(null);

  useEffect(()=>{
    const nav=document.querySelector('.side nav');
    if(!nav) return;
    const mount=document.createElement('div');
    mount.className='inbox-nav-mount';
    nav.appendChild(mount);
    setHost(mount);
    return ()=>mount.remove();
  },[]);

  if(!host) return null;
  return createPortal(
    <a href="/inbox" className="inbox-nav-link" aria-label="Sales Inbox">
      <Mail size={17} strokeWidth={1.8}/>
      <span>Sales Inbox</span>
      <span className="inbox-badge">Inbox</span>
    </a>,
    host
  );
}
