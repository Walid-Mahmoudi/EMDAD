import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function env(name){ return process.env[name] || ''; }
function authorized(request){
  const configuredToken=env('EMAIL_SYNC_TOKEN');
  if(configuredToken) return request.headers.get('authorization')===`Bearer ${configuredToken}`;
  const origin=request.headers.get('origin');
  const host=request.headers.get('host');
  if(!origin || !host) return false;
  try{return new URL(origin).host===host;}catch{return false;}
}
function supabaseServer(){
  const url=env('NEXT_PUBLIC_SUPABASE_URL');
  const key=env('SUPABASE_SERVICE_ROLE_KEY')||env('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')||env('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if(!url||!key) throw new Error('Supabase environment variables are missing.');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function GET(request){
  if(!authorized(request)) return Response.json({ok:false,error:'Unauthorized'},{status:401});
  const sb=supabaseServer();
  const {data,error}=await sb.from('sales_inbox').select('id,subject,status').in('status',['new','reviewing']).order('received_at',{ascending:false}).limit(25);
  if(error) return Response.json({ok:false,error:error.message},{status:502});
  return Response.json({ok:true,items:data||[]});
}
