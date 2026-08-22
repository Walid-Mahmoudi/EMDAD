import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{autoRefreshToken:false,persistSession:false}});
export async function POST(req){try{const {id,full_name,email,phone}=await req.json();if(!id||!full_name||!email)return NextResponse.json({error:'Name, email and user id are required'},{status:400});const {error}=await admin.from('profiles').upsert({id,full_name,email,phone:phone||null,role:'employee',is_active:false},{onConflict:'id'});if(error)return NextResponse.json({error:error.message},{status:400});return NextResponse.json({ok:true});}catch(e){return NextResponse.json({error:e.message},{status:500})}}
