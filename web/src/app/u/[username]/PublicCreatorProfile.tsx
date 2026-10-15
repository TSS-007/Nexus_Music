"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Creator = { username: string; display_name: string; roles: string[]; bio: string | null; avatar_url: string | null; music_links: Record<string, string> | null };
export default function PublicCreatorProfile({ username }: { username: string }) {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError("");
      const { data, error } = await supabase.from("profiles")
        .select("username, display_name, roles, bio, avatar_url, music_links")
        .eq("username", username).maybeSingle();
      if (!active) return;
      if (error) setError(error.message);
      setCreator(data as Creator | null); setLoading(false);
    }
    if (username) void load();
    return () => { active = false; };
  }, [username]);
  const links = Object.entries(creator?.music_links ?? {}).filter(([, value]) => {
    if (typeof value !== "string") return false;
    try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
  });
  return <main className="min-h-screen bg-[#080810] px-5 py-10 text-white">
    <div className="mx-auto max-w-3xl">
      <nav className="flex items-center justify-between"><Link href="/" className="text-2xl font-black tracking-widest">NEXUS<span className="text-violet-500">.</span></Link><Link href="/discover" className="text-sm text-violet-300 transition hover:text-white">← Discover creators</Link></nav>
      {loading ? <p className="mt-16 text-gray-400">Loading creator profile...</p> : error ? <p role="alert" className="mt-16 text-red-400">{error}</p> : !creator ? <div className="mt-16 rounded-2xl border border-white/10 p-10"><h1 className="text-2xl font-bold">Creator not found</h1><p className="mt-3 text-gray-400">This username doesn't have a public profile.</p><Link href="/discover" className="mt-6 inline-block text-violet-300">Browse creators →</Link></div> :
      <article className="mt-14 overflow-hidden rounded-3xl border border-white/10 bg-[#12121e]">
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
          <h2 className="mt-9 text-lg font-semibold">Music & links</h2>
          {links.length ? <div className="mt-4 flex flex-wrap gap-3">{links.map(([name, url]) => <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-3 text-sm font-medium capitalize text-violet-200 transition hover:-translate-y-0.5 hover:border-violet-400 hover:bg-violet-600/25">{name} ↗</a>)}</div> : <p className="mt-3 text-gray-400">No links added yet.</p>}
        </div>
      </article>}
    </div>
  </main>;
}
