"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
type Track = {id:string;title:string;genre:string|null;kind:string;owner_id:string;audio_path:string};
type Highlight = {id:string;track_id:string;ends_at:string;track:Track};
export default function HighlightsPage(){
 const [items,setItems]=useState<Highlight[]>([]),[tracks,setTracks]=useState<Track[]>([]);
 const [balance,setBalance]=useState<number|null>(null),[uid,setUid]=useState(""),[chosen,setChosen]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function load(){
  const {data:{user}}=await supabase.auth.getUser();setUid(user?.id??"");
  const {data:h,error}=await supabase.from("track_highlights").select("id,track_id,ends_at,track:tracks(id,title,genre,kind,owner_id,audio_path)").gt("ends_at",new Date().toISOString()).order("ends_at",{ascending:true});
  if(error)setMessage(error.message);else setItems(((h??[]) as unknown as Highlight[]).filter(x=>x.track));
  if(user){
   const [{data:a},{data:t}]=await Promise.all([supabase.from("credit_accounts").select("balance").eq("user_id",user.id).maybeSingle(),supabase.from("tracks").select("id,title,genre,kind,owner_id,audio_path").eq("owner_id",user.id).order("created_at",{ascending:false})]);
   setBalance(a?.balance??0);setTracks((t??[]) as Track[]);
  }
 }
 useEffect(()=>{void load()},[]);
 async function promote(){if(!chosen)return;setBusy(true);setMessage("");const {error}=await supabase.rpc("promote_nexus_track",{p_track:chosen});setMessage(error?error.message:"Your track is now highlighted for 7 days!");await load();setBusy(false);}
 return <main className="nexus-glow min-h-screen bg-[#070711] px-5 py-10 text-white"><div className="mx-auto max-w-6xl">
  <nav className="mb-14 flex flex-wrap items-center justify-between gap-4"><Link href="/" className="text-2xl font-black tracking-widest">NEXUS<span className="text-violet-400">.</span></Link><div className="flex flex-wrap gap-4 text-sm text-gray-300"><Link href="/music">Music</Link><Link href="/discover">Creators</Link><Link href="/dashboard">Dashboard</Link><Link href="/credits">Credits</Link></div></nav>
  <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-300">Featured by the community</p><h1 className="mt-3 text-4xl font-black sm:text-6xl">Nexus <span className="nexus-gradient-text">Highlights.</span></h1>
  <p className="mt-5 max-w-2xl text-gray-400">Discover tracks promoted by their creators. Highlights last 7 days and cost 10 Nexus credits. Promotion is placement, not a promise of plays.</p>
  <section className="nexus-panel mt-10 rounded-3xl p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-bold">Promote your music</h2><p className="mt-1 text-sm text-gray-400">{uid?`Your balance: ${balance??0} credits`:"Sign in to promote a track."}</p></div><Link href="/credits" className="text-sm font-semibold text-violet-300">View credits →</Link></div>
   {uid?<div className="mt-5 flex flex-wrap gap-3"><select aria-label="Choose your track" value={chosen} onChange={e=>setChosen(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/20 bg-[#171429] px-4 py-3"><option value="">Select one of your tracks</option>{tracks.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select><button onClick={promote} disabled={!chosen||busy||(balance??0)<10} className="nexus-cta rounded-xl px-6 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-40">{busy?"Promoting…":"Highlight · 10 credits"}</button></div>:<Link href="/login" className="nexus-cta mt-5 inline-block rounded-xl px-5 py-3">Sign in</Link>}
   {message&&<p role="status" className="mt-4 text-sm text-violet-200">{message}</p>}
  </section>
  <h2 className="mb-5 mt-12 text-2xl font-bold">On the spotlight</h2>
  {items.length===0?<div className="nexus-panel rounded-2xl p-10 text-center text-gray-400">No active highlights yet. Be the first to feature a track.</div>:<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map(h=><article key={h.id} className="nexus-panel nexus-panel-hover rounded-2xl p-6"><span className="text-xs font-semibold uppercase tracking-widest text-violet-300">Featured track</span><h3 className="mt-5 text-xl font-bold">{h.track.title}</h3><p className="mt-2 text-sm capitalize text-gray-400">{h.track.genre||"Independent"} · {h.track.kind}</p><audio className="mt-5 w-full" controls preload="none" src={supabase.storage.from("tracks").getPublicUrl(h.track.audio_path).data.publicUrl}/><p className="mt-4 text-xs text-gray-500">Featured until {new Date(h.ends_at).toLocaleDateString()}</p></article>)}</div>}
 </div></main>;
}
