'use client';
import SalesInbox from '../SalesInbox';
import EmailSyncPanel from './EmailSyncPanel';
import AIAnalyzePanel from './AIAnalyzePanel';

export default function InboxPage(){
  return <><EmailSyncPanel/><AIAnalyzePanel/><SalesInbox/></>;
}
