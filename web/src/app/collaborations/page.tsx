"use client";
import NexusHover from "@/app/components/NexusHover";
import {useEffect,useState} from "react";
import Link from "next/link";
import {supabase} from "@/lib/supabase";
type Request={id:string;sender_id:string;recipient_id:string;message:string;status:string;created_at:string};
type Profile={id:string;username:string;display_name:string};
export default function CollaborationsPage(){
 const [uid,setUid]=useState(""),[requests,setRequests]=useState<Request[]>([]),[people,setPeople]=useState<Record<string,Profile>>({}),[error,setError]=useState(""),[busy,setBusy]=useState("");
 async function load(){
  const {data:{user}}=await supabase.auth.getUser();if(!user)return;setUid(user.id);
  const {data,error}=await supabase.from("collaboration_requests").select("id,sender_id,recipient_id,message,status,created_at").or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order("created_at",{ascending:false}).limit(100);
  if(error){setError(error.message);return;}const rows=(data??[]) as Request[];setRequests(rows);
  const ids=[...new Set(rows.flatMap(r=>[r.sender_id,r.recipient_id]))];if(ids.length){const {data:p}=await supabase.from("profiles").select("id,username,display_name").in("id",ids);setPeople(Object.fromEntries(((p??[]) as Profile[]).map(x=>[x.id,x])));}
 }
 useEffect(()=>{void load()},[]);
 async function respond(id:string,accept:boolean){setBusy(id);const {error}=await supabase.rpc("respond_to_collaboration",{p_request:id,p_accept:accept});setError(error?.message??"");await load();setBusy("");}
 return <main className="nexus-glow min-h-screen bg-[#070711] px-5 py-10 text-white"><div className="mx-auto max-w-4xl"><nav className="mb-12 flex items-center justify-between"><NexusHover><Link href="/" className="text-2xl font-black tracking-widest">NEXUS<span className="text-violet-400">.</span></Link></NexusHover><NexusHover><Link href="/discover" className="text-sm text-violet-300">Find creators →</Link></NexusHover></nav><p className="text-xs font-bold uppercase tracking-widest text-violet-300">Creator connections</p><h1 className="mt-3 text-4xl font-black">Collaborations</h1><p className="mt-3 text-gray-400">Manage requests to work with artists, producers and curators.</p>
 {!uid?<NexusHover><Link href="/login" className="nexus-cta mt-8 inline-block rounded-xl px-6 py-3">Sign in</Link></NexusHover>:<div className="mt-8 space-y-4">{requests.length===0?<div className="nexus-panel rounded-2xl p-10 text-gray-400">No collaboration requests yet. <NexusHover><Link href="/discover" className="text-violet-300 underline">Find a creator</Link></NexusHover> to connect with.</div>:requests.map(r=>{const incoming=r.recipient_id===uid;const other=people[incoming?r.sender_id:r.recipient_id];return <article key={r.id} className="nexus-panel rounded-2xl p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-violet-300">{incoming?"Incoming request":"Sent request"}</p><h2 className="mt-2 text-lg font-bold">{other?.display_name??"Creator"} {other&&<NexusHover><Link className="text-sm font-normal text-violet-300" href={`/u/${encodeURIComponent(other.username)}`}>@{other.username}</Link></NexusHover>}</h2></div><span className="rounded-full border border-white/15 px-3 py-1 text-sm capitalize text-gray-300">{r.status}</span></div><p className="mt-4 whitespace-pre-wrap break-words text-gray-300">{r.message}</p>{incoming&&r.status==="pending"&&<div className="mt-5 flex gap-3"><button disabled={busy===r.id} onClick={()=>respond(r.id,true)} className="nexus-cta rounded-xl px-5 py-2 font-semibold disabled:opacity-40">Accept</button><button disabled={busy===r.id} onClick={()=>respond(r.id,false)} className="rounded-xl border border-white/20 px-5 py-2 hover:bg-white/10 disabled:opacity-40">Decline</button></div>}</article>})}</div>}{error&&<p role="alert" className="mt-5 text-red-300">{error}</p>}</div></main>;
}
