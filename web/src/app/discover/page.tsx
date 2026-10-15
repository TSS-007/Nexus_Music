"use client";

import NexusHover from "@/app/components/NexusHover";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Creator = { id: string; username: string; display_name: string; roles: string[]; bio: string | null; avatar_url: string | null };
const roles = ["all", "artist", "producer", "curator"] as const;

export default function DiscoverPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError("");
      const { data, error } = await supabase.from("profiles")
        .select("id, username, display_name, roles, bio, avatar_url")
        .order("created_at", { ascending: false }).limit(100);
      if (!active) return;
      if (error) setError("Could not load creators: " + error.message);
      else setCreators((data ?? []) as Creator[]);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [refresh]);
  const filtered = useMemo(() => creators.filter(c =>
    (role === "all" || (c.roles ?? []).includes(role)) &&
    [c.username, c.display_name, c.bio ?? ""].some(s => s.toLowerCase().includes(search.toLowerCase().trim()))
  ), [creators, role, search]);
  return <main className="min-h-screen bg-[#070711] px-5 py-10 text-white">
    <div className="mx-auto max-w-6xl">
      <nav className="mb-12 flex items-center justify-between gap-3">
        <NexusHover><Link href="/" className="text-2xl font-black tracking-widest">NEXUS<span className="text-violet-500">.</span></Link></NexusHover>
        <div className="flex gap-3"><NexusHover><Link href="/dashboard" className="rounded-xl border border-white/15 px-4 py-2 text-sm transition hover:border-violet-400 hover:bg-white/10">Dashboard</Link></NexusHover><NexusHover><Link href="/profile" className="rounded-xl bg-violet-600 px-4 py-2 text-sm transition hover:bg-violet-500">My Profile</Link></NexusHover></div>
      </nav>
      <h1 className="text-4xl font-black">Discover creators</h1>
      <p className="mt-3 text-gray-400">Meet artists, producers and curators in the Nexus community.</p>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <input aria-label="Search creators" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, username or bio..."
          className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#171429] px-4 py-3 outline-none transition focus:border-violet-400" />
        <NexusHover><button onClick={() => setRefresh(x => x + 1)} className="rounded-xl border border-white/15 px-4 py-3 transition hover:bg-white/10">Refresh</button></NexusHover>
      </div>
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by role">
        {roles.map(r => <NexusHover><button key={r} aria-pressed={role === r} onClick={() => setRole(r)}
          className={`rounded-full px-4 py-2 text-sm capitalize transition duration-200 hover:-translate-y-0.5 ${role === r ? "bg-violet-600 text-white" : "border border-white/15 bg-white/5 text-gray-300 hover:border-violet-400"}`}>{r === "all" ? "All creators" : r + "s"}</button></NexusHover>)}
      </div>
      <p className="mt-6 text-sm text-gray-400" aria-live="polite">{loading ? "Loading creators..." : `${filtered.length} creator${filtered.length === 1 ? "" : "s"} found`}</p>
      {error && <div role="alert" className="mt-5 rounded-xl border border-red-500/40 p-4 text-red-300">{error}</div>}
      {!loading && !error && filtered.length === 0 && <div className="mt-8 rounded-2xl border border-white/10 p-10 text-center text-gray-400">No creators match your search yet. Try another name or role.</div>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(c => <NexusHover><Link key={c.id} href={`/u/${encodeURIComponent(c.username)}`}
          className="nexus-panel nexus-panel-hover group rounded-2xl p-6 focus-visible:outline-2 focus-visible:outline-violet-400">
          <div className="flex items-center gap-4">
            {c.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-white/10 transition group-hover:ring-violet-500" />
            ) : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-800 text-2xl font-bold">{c.display_name?.charAt(0).toUpperCase() || "N"}</div>}
            <div className="min-w-0"><h2 className="truncate text-lg font-bold">{c.display_name}</h2><p className="truncate text-sm text-violet-300">@{c.username}</p></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">{(c.roles ?? []).map(r => <span key={r} className="rounded-full bg-violet-500/15 px-3 py-1 text-xs capitalize text-violet-200">{r}</span>)}</div>
          <p className="mt-4 line-clamp-3 min-h-12 whitespace-pre-wrap text-sm text-gray-400">{c.bio || "This creator hasn't added a bio yet."}</p>
          <p className="mt-5 text-sm font-medium text-violet-300 transition group-hover:translate-x-1">View profile →</p>
        </Link></NexusHover>)}
      </div>
    </div>
  </main>;
}
