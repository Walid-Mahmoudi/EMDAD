import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;

function createAdminClient(){
  return createClient(url,serviceKey,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false},global:{headers:{Authorization:`Bearer ${serviceKey}`}}});
}

export async function POST(req){
  try{
    const token=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'').trim();
    if(!token)return NextResponse.json({error:'Unauthorized'},{status:401});
    if(!url||!anonKey||!serviceKey)return NextResponse.json({error:'Server Supabase configuration is incomplete. Check Vercel environment variables.'},{status:500});

    const userClient=createClient(url,anonKey,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false},global:{headers:{Authorization:`Bearer ${token}`}}});
    const {data:{user},error:authError}=await userClient.auth.getUser(token);
    if(authError||!user)return NextResponse.json({error:'Unauthorized'},{status:401});

    const {data:me,error:profileCheckError}=await userClient.from('profiles').select('role,is_active').eq('id',user.id).maybeSingle();
    if(profileCheckError)return NextResponse.json({error:profileCheckError.message},{status:500});
    if(!me||me.role!=='admin'||!me.is_active)return NextResponse.json({error:'Admin access required'},{status:403});

    const {full_name,email,password,phone,job_title}=await req.json();
    if(!full_name||!email||!password)return NextResponse.json({error:'Full name, email and password are required'},{status:400});

    const admin=createAdminClient();
    const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});
    if(error)return NextResponse.json({error:error.message},{status:400});

    const {error:profileError}=await admin.from('profiles').insert({id:data.user.id,full_name,email,phone:phone||null,job_title:job_title||null,role:'employee',is_active:true});
    if(profileError){
      await admin.auth.admin.deleteUser(data.user.id);
      return NextResponse.json({error:profileError.message},{status:400});
    }
    return NextResponse.json({ok:true});
  }catch(e){
    return NextResponse.json({error:e?.message||'Unexpected server error'},{status:500});
  }
}
