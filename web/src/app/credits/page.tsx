"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {supabase} from "@/lib/supabase";
type Profile={id:string;username:string;display_name:string};
type Tx={id:number;amount:number;kind:string;note:string;created_at:string};
export default function CreditsPage(){
 const [uid,setUid]=useState(""),[balance,setBalance]=useState(0),[staff,setStaff]=useState<{role:string;per_grant_limit:number;monthly_limit:number}|null>(null),[profiles,setProfiles]=useState<Profile[]>([]),[history,setHistory]=useState<Tx[]>([]);
 const [recipient,setRecipient]=useState(""),[amount,setAmount]=useState(10),[note,setNote]=useState(""),[limit,setLimit]=useState(10),[monthly,setMonthly]=useState(100),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function load(){
  const {data:{user}}=await supabase.auth.getUser();if(!user)return;setUid(user.id);
  const [a,s,t,p]=await Promise.all([
   supabase.from("credit_accounts").select("balance").eq("user_id",user.id).maybeSingle(),
   supabase.from("credit_staff").select("role,per_grant_limit,monthly_limit").eq("user_id",user.id).maybeSingle(),
   supabase.from("credit_transactions").select("id,amount,kind,note,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(25),
   supabase.from("profiles").select("id,username,display_name").order("username").limit(200)]);
  setBalance(a.data?.balance??0);setStaff(s.data??null);setHistory((t.data??[]) as Tx[]);setProfiles((p.data??[]) as Profile[]);
 }
 useEffect(()=>{void load()},[]);
 async function grant(){if(!recipient)return;setBusy(true);setMessage("");const {error}=await supabase.rpc("grant_nexus_credits",{p_recipient:recipient,p_amount:amount,p_note:note});setMessage(error?error.message:"Credits granted successfully.");await load();setBusy(false);}
 async function delegate(enabled:boolean){if(!recipient)return;setBusy(true);setMessage("");const {error}=await supabase.rpc("set_nexus_grantor",{p_recipient:recipient,p_enabled:enabled,p_per_grant_limit:limit,p_monthly_limit:monthly});setMessage(error?error.message:enabled?"Granting permission enabled.":"Granting permission revoked.");await load();setBusy(false);}
 return <main className="nexus-glow min-h-screen bg-[#070711] px-5 py-10 text-white"><div className="mx-auto max-w-5xl"><nav className="mb-14 flex flex-wrap items-center justify-between gap-4"><Link href="/" className="text-2xl font-black tracking-widest">NEXUS<span className="text-violet-400">.</span></Link><div className="flex gap-5 text-sm"><Link href="/highlights">Highlights</Link><Link href="/dashboard">Dashboard</Link></div></nav>
 <p className="text-xs font-bold uppercase tracking-widest text-violet-300">Creator economy</p><h1 className="mt-3 text-4xl font-black">Your Nexus credits</h1><p className="mt-3 text-gray-400">Use credits to feature your own tracks. Credits are promotional points, not cash.</p>
 {!uid?<Link href="/login" className="nexus-cta mt-8 inline-block rounded-xl px-6 py-3">Sign in to view credits</Link>:<>
 <div className="nexus-panel mt-8 rounded-3xl p-8"><p className="text-sm text-gray-400">Available balance</p><p className="mt-2 text-6xl font-black text-violet-300">{balance}</p><p className="mt-3 text-sm text-gray-400">10 credits = one 7-day track highlight</p><Link href="/highlights" className="nexus-cta mt-6 inline-block rounded-xl px-6 py-3 font-semibold">Explore highlights ↗</Link></div>
 {staff&&<section className="nexus-panel mt-8 rounded-3xl p-7"><h2 className="text-2xl font-bold">Credit management <span className="ml-2 text-sm font-normal capitalize text-violet-300">({staff.role})</span></h2><p className="mt-2 text-sm text-gray-400">{staff.role==="grantor"?`You can grant up to ${staff.per_grant_limit} credits at a time, with a ${staff.monthly_limit}-credit monthly allowance.`:"As admin, you can grant credits and appoint limited credit grantors."}</p>
 <label className="mt-6 block text-sm text-gray-300" htmlFor="recipient">Recipient</label><select id="recipient" value={recipient} onChange={e=>setRecipient(e.target.value)} className="mt-2 w-full rounded-xl border border-white/20 bg-[#171429] p-3"><option value="">Choose a creator</option>{profiles.map(p=><option key={p.id} value={p.id}>{p.display_name} (@{p.username})</option>)}</select>
 <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm text-gray-300">Credits to grant<input type="number" min={1} max={staff.role==="grantor"?staff.per_grant_limit:100000} value={amount} onChange={e=>setAmount(Number(e.target.value))} className="mt-2 block w-full rounded-xl border border-white/20 bg-[#171429] p-3"/></label><label className="text-sm text-gray-300">Reason (optional)<input maxLength={300} value={note} onChange={e=>setNote(e.target.value)} className="mt-2 block w-full rounded-xl border border-white/20 bg-[#171429] p-3"/></label></div>
 <button disabled={busy||!recipient||amount<1} onClick={grant} className="nexus-cta mt-5 rounded-xl px-6 py-3 font-semibold disabled:opacity-40">Grant credits</button>
 {staff.role==="admin"&&<div className="mt-8 border-t border-white/10 pt-6"><h3 className="text-lg font-bold">Delegate limited granting access</h3><p className="mt-2 text-sm text-gray-400">Grantors cannot appoint others or exceed your limits.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm">Max per grant<input type="number" min={1} value={limit} onChange={e=>setLimit(Number(e.target.value))} className="mt-2 block w-full rounded-xl border border-white/20 bg-[#171429] p-3"/></label><label className="text-sm">Monthly grant limit<input type="number" min={1} value={monthly} onChange={e=>setMonthly(Number(e.target.value))} className="mt-2 block w-full rounded-xl border border-white/20 bg-[#171429] p-3"/></label></div><div className="mt-4 flex flex-wrap gap-3"><button onClick={()=>delegate(true)} disabled={busy||!recipient} className="nexus-cta rounded-xl px-5 py-3 disabled:opacity-40">Enable grantor</button><button onClick={()=>delegate(false)} disabled={busy||!recipient} className="rounded-xl border border-white/20 px-5 py-3 hover:bg-white/10 disabled:opacity-40">Revoke grantor</button></div></div>}
 {message&&<p role="status" className="mt-5 text-sm text-violet-200">{message}</p>}
 </section>}
 <section className="nexus-panel mt-8 rounded-3xl p-7"><h2 className="text-xl font-bold">Credit activity</h2>{history.length===0?<p className="mt-4 text-gray-400">No credit activity yet.</p>:<div className="mt-5 divide-y divide-white/10">{history.map(t=><div key={t.id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-medium capitalize">{t.kind}</p><p className="text-xs text-gray-400">{t.note||new Date(t.created_at).toLocaleDateString()}</p></div><strong className={t.amount>0?"text-emerald-300":"text-violet-300"}>{t.amount>0?"+":""}{t.amount}</strong></div>)}</div>}</section>
 </>}
 </div></main>;
}
