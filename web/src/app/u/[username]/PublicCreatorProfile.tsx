"use client";

import NexusHover from "@/app/components/NexusHover";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Creator = { id: string; username: string; display_name: string; roles: string[]; bio: string | null; avatar_url: string | null; music_links: Record<string, string> | null };
export default function PublicCreatorProfile({ username }: { username: string }) {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tracks,setTracks] = useState<{id:string;title:string;genre:string;kind:string;description:string|null;audio_path:string}[]>([]);
  const [viewer,setViewer] = useState("");
  const [requestMessage,setRequestMessage] = useState("");
  const [requestStatus,setRequestStatus] = useState("");
  const [sending,setSending] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError("");
      const { data, error } = await supabase.from("profiles")
        .select("id, username, display_name, roles, bio, avatar_url, music_links")
        .eq("username", username).maybeSingle();
      if (!active) return;
      if (error) setError(error.message);
      setCreator(data as Creator | null);
      if(data?.id){const [{data:uploaded},{data:{user}}]=await Promise.all([supabase.from("tracks").select("id,title,genre,kind,description,audio_path").eq("owner_id",data.id).order("created_at",{ascending:false}).limit(30),supabase.auth.getUser()]);if(active){setTracks(uploaded??[]);setViewer(user?.id??"");}}
      setLoading(false);
    }
    if (username) void load();
    return () => { active = false; };
  }, [username]);
  async function sendRequest(){if(!creator||!viewer)return;setSending(true);setRequestStatus("");const {error}=await supabase.from("collaboration_requests").insert({sender_id:viewer,recipient_id:creator.id,message:requestMessage.trim()});setRequestStatus(error?error.message:"Collaboration request sent!");if(!error)setRequestMessage("");setSending(false);}
  const links = Object.entries(creator?.music_links ?? {}).filter(([, value]) => {
    if (typeof value !== "string") return false;
    try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
  });
  return <main className="min-h-screen bg-[#080810] px-5 py-10 text-white">
    <div className="mx-auto max-w-3xl">
      <nav className="flex items-center justify-between"><NexusHover><Link href="/" className="text-2xl font-black tracking-widest">NEXUS<span className="text-violet-500">.</span></Link></NexusHover><NexusHover><Link href="/discover" className="text-sm text-violet-300 transition hover:text-white">← Discover creators</Link></NexusHover></nav>
      {loading ? <p className="mt-16 text-gray-400">Loading creator profile...</p> : error ? <p role="alert" className="mt-16 text-red-400">{error}</p> : !creator ? <div className="mt-16 rounded-2xl border border-white/10 p-10"><h1 className="text-2xl font-bold">Creator not found</h1><p className="mt-3 text-gray-400">This username doesn't have a public profile.</p><NexusHover><Link href="/discover" className="mt-6 inline-block text-violet-300">Browse creators →</Link></NexusHover></div> :
      <article className="nexus-panel mt-14 overflow-hidden rounded-3xl">
        <div className="h-32 bg-gradient-to-r from-violet-950 via-[#3c1a65] to-[#101024]" />
        <div className="px-7 pb-10 sm:px-10">
          {creator.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={creator.avatar_url} alt="" className="-mt-14 h-28 w-28 rounded-full border-4 border-[#12121e] bg-[#12121e] object-cover" />
          ) : <div className="-mt-14 flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#12121e] bg-violet-700 text-4xl font-bold">{creator.display_name.charAt(0).toUpperCase()}</div>}
          <h1 className="mt-5 text-3xl font-black">{creator.display_name}</h1>
          <p className="mt-1 text-violet-300">@{creator.username}</p>
          <div className="mt-4 flex flex-wrap gap-2">{(creator.roles ?? []).map(r => <span key={r} className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-sm capitalize text-violet-200">{r}</span>)}</div>
          <h2 className="mt-9 text-lg font-semibold">About</h2>
          <p className="mt-3 whitespace-pre-wrap break-words text-gray-300">{creator.bio || "No bio added yet."}</p>
          <h2 className="mt-9 text-lg font-semibold">Music portfolio</h2>
          {tracks.length===0?<p className="mt-3 text-gray-400">No tracks uploaded yet.</p>:<div className="mt-4 grid gap-4 sm:grid-cols-2">{tracks.map(t=><div key={t.id} className="rounded-2xl border border-white/10 bg-[#171429] p-5"><h3 className="font-bold">{t.title}</h3><p className="mt-1 text-xs capitalize text-violet-300">{t.kind} · {t.genre}</p>{t.description&&<p className="mt-2 text-sm text-gray-400">{t.description}</p>}<audio className="mt-4 w-full" controls preload="none" src={supabase.storage.from("tracks").getPublicUrl(t.audio_path).data.publicUrl}/></div>)}</div>}
          <h2 className="mt-9 text-lg font-semibold">Music & links</h2>
          {links.length ? <div className="mt-4 flex flex-wrap gap-3">{links.map(([name, url]) => <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-3 text-sm font-medium capitalize text-violet-200 transition hover:-translate-y-0.5 hover:border-violet-400 hover:bg-violet-600/25">{name} ↗</a>)}</div> : <p className="mt-3 text-gray-400">No links added yet.</p>}
          {viewer&&viewer!==creator.id&&<section className="mt-9 border-t border-white/10 pt-8"><h2 className="text-lg font-semibold">Connect with {creator.display_name}</h2><p className="mt-2 text-sm text-gray-400">Send a private collaboration request to this creator.</p><textarea aria-label="Collaboration message" minLength={10} maxLength={1000} rows={4} value={requestMessage} onChange={e=>setRequestMessage(e.target.value)} placeholder="Tell them what you'd like to create together..." className="mt-4 w-full rounded-xl border border-white/20 bg-[#171429] p-4 outline-none focus:border-violet-400"/><button disabled={sending||requestMessage.trim().length<10} onClick={sendRequest} className="nexus-cta mt-3 rounded-xl px-6 py-3 font-semibold disabled:opacity-40">{sending?"Sending…":"Send collaboration request"}</button>{requestStatus&&<p role="status" className="mt-3 text-sm text-violet-300">{requestStatus}</p>}</section>}
          {!viewer&&<p className="mt-8 text-sm text-gray-400"><NexusHover><Link href="/login" className="text-violet-300 underline">Sign in</Link></NexusHover> to connect with this creator.</p>}
        </div>
      </article>}
    </div>
  </main>;
}
