"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Track = { id: string; owner_id: string; title: string; genre: string; kind: "song" | "beat"; description: string; audio_path: string; created_at: string };
type Creator = { id: string; username: string; display_name: string; avatar_url: string | null };
const genres = ["All", "Trap", "Drill", "Hip-Hop", "R&B", "Pop", "Electronic", "Indie", "Ambient", "Other"];
const kinds = ["all", "song", "beat"] as const;
function clock(seconds: number) { if (!Number.isFinite(seconds)) return "0:00"; return Math.floor(seconds / 60) + ":" + String(Math.floor(seconds % 60)).padStart(2, "0"); }

export default function MusicLibrary() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [creators, setCreators] = useState<Record<string, Creator>>({});
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");
  const [kind, setKind] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError("");
      const { data, error } = await supabase.from("tracks").select("id, owner_id, title, genre, kind, description, audio_path, created_at").order("created_at", { ascending: false }).limit(200);
      if (!active) return;
      if (error) { setError(error.message); setLoading(false); return; }
      const rows = (data ?? []) as Track[];
      setTracks(rows);
      const ids = [...new Set(rows.map(t => t.owner_id))];
      if (ids.length) {
        const { data: profiles } = await supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", ids);
        if (!active) return;
        setCreators(Object.fromEntries(((profiles ?? []) as Creator[]).map(p => [p.id, p])));
      }
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [refresh]);
  const filtered = useMemo(() => tracks.filter(t => {
    const artist = creators[t.owner_id];
    return (genre === "All" || t.genre === genre) && (kind === "all" || t.kind === kind) &&
      [t.title, t.genre, artist?.display_name ?? "", artist?.username ?? ""].some(v => v.toLowerCase().includes(search.trim().toLowerCase()));
  }), [tracks, creators, genre, kind, search]);
  function choose(t: Track) {
    if (selected?.id === t.id) {
      if (audio.current?.paused) { void audio.current.play().catch(() => setError("Audio could not be played.")); }
      else audio.current?.pause();
    } else { setSelected(t); setPosition(0); setDuration(0); setPlaying(false); }
  }
  useEffect(() => {
    if (!selected || !audio.current) return;
    audio.current.load();
    void audio.current.play().catch(() => setError("Audio could not be played. Please try again."));
  }, [selected]);
  function skip(direction: number) {
    if (!selected || !filtered.length) return;
    const index = filtered.findIndex(t => t.id === selected.id);
    choose(filtered[(index + direction + filtered.length) % filtered.length]);
  }
  return <main className="min-h-screen bg-[#080810] px-5 pb-36 pt-8 text-white">
    <div className="mx-auto max-w-6xl">
      <nav className="mb-12 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="text-2xl font-black tracking-widest">NEXUS<span className="text-violet-500">.</span></Link>
        <div className="flex items-center gap-3">
          <Link href="/discover" className="text-sm text-gray-300 transition hover:text-white">Creators</Link>
          <Link href="/dashboard" className="rounded-xl border border-white/15 px-4 py-2 text-sm transition hover:bg-white/10">Dashboard</Link>
          <Link href="/upload" className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-violet-500">+ Upload track</Link>
        </div>
      </nav>
      <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/70 via-[#161126] to-[#10101b] px-7 py-12 sm:px-12">
        <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-violet-300">Nexus Radio</span>
        <h1 className="mt-5 text-4xl font-black sm:text-6xl">Find your next sound.</h1>
        <p className="mt-4 max-w-xl text-gray-300">Discover independent songs and beats. Press play and explore.</p>
      </div>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <input aria-label="Search music" placeholder="Search tracks, artists or genres..." value={search} onChange={e => setSearch(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#141420] px-5 py-3 outline-none transition focus:border-violet-400" />
        <select aria-label="Genre" value={genre} onChange={e => setGenre(e.target.value)} className="rounded-xl border border-white/15 bg-[#141420] px-4 py-3">{genres.map(g => <option key={g}>{g}</option>)}</select>
        <button onClick={() => setRefresh(x => x + 1)} className="rounded-xl border border-white/15 px-4 py-3 transition hover:bg-white/10">Refresh</button>
      </div>
      <div className="mt-5 flex gap-2" role="group" aria-label="Track type">
        {kinds.map(k => <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}
          className={`rounded-full px-5 py-2 text-sm capitalize transition hover:-translate-y-0.5 ${kind === k ? "bg-violet-600" : "border border-white/15 bg-white/5 hover:border-violet-500/50"}`}>{k === "all" ? "All music" : k + "s"}</button>)}
      </div>
      <p aria-live="polite" className="mt-7 text-sm text-gray-400">{loading ? "Loading tracks..." : `${filtered.length} track${filtered.length === 1 ? "" : "s"}`}</p>
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-500/40 p-4 text-red-300">{error}</p>}
      {!loading && !error && filtered.length === 0 && <div className="mt-6 rounded-2xl border border-white/10 bg-[#12121e] p-10 text-center"><p className="text-gray-300">No tracks match yet.</p><Link href="/upload" className="mt-4 inline-block text-violet-300 underline">Be the first to upload →</Link></div>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(t => <article key={t.id} className={`group rounded-2xl border bg-[#12121e] p-5 transition duration-200 hover:-translate-y-1 hover:bg-[#1c1930] hover:shadow-xl hover:shadow-violet-900/20 ${selected?.id === t.id ? "border-violet-500" : "border-white/10 hover:border-violet-500/50"}`}>
          <div className="flex items-start gap-4">
            <button aria-label={selected?.id === t.id && playing ? "Pause " + t.title : "Play " + t.title} onClick={() => choose(t)}
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-700 to-fuchsia-950 text-2xl shadow-lg transition group-hover:scale-105 hover:brightness-125">{selected?.id === t.id && playing ? "Ⅱ" : "▶"}</button>
            <div className="min-w-0"><h2 className="truncate text-lg font-bold">{t.title}</h2>
              {creators[t.owner_id] ? <Link href={`/u/${encodeURIComponent(creators[t.owner_id].username)}`} className="text-sm text-violet-300 hover:underline">{creators[t.owner_id].display_name}</Link> : <p className="text-sm text-gray-400">Creator</p>}
              <div className="mt-2 flex gap-2"><span className="rounded-full bg-white/10 px-2 py-1 text-xs">{t.genre}</span><span className="rounded-full bg-violet-500/15 px-2 py-1 text-xs capitalize text-violet-200">{t.kind}</span></div>
            </div>
          </div>
          {t.description && <p className="mt-4 line-clamp-2 text-sm text-gray-400">{t.description}</p>}
        </article>)}
      </div>
    </div>
    {selected && <div className="fixed inset-x-0 bottom-0 z-50 border-t border-violet-500/30 bg-[#10101b]/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 sm:gap-5">
        <div className="min-w-0 flex-1"><p className="truncate font-semibold">{selected.title}</p><p className="truncate text-xs text-gray-400">{creators[selected.owner_id]?.display_name ?? "Creator"}</p></div>
        <div className="flex items-center gap-3">
          <button aria-label="Previous track" onClick={() => skip(-1)} className="rounded-full p-2 transition hover:bg-white/10">⏮</button>
          <button aria-label={playing ? "Pause" : "Play"} onClick={() => { if (audio.current?.paused) void audio.current.play().catch(() => setError("Playback failed.")); else audio.current?.pause(); }} className="h-11 w-11 rounded-full bg-violet-600 font-bold transition hover:scale-110 hover:bg-violet-500">{playing ? "Ⅱ" : "▶"}</button>
          <button aria-label="Next track" onClick={() => skip(1)} className="rounded-full p-2 transition hover:bg-white/10">⏭</button>
        </div>
        <div className="flex w-full items-center gap-3 text-xs text-gray-400 sm:w-64">
          <span>{clock(position)}</span>
          <input aria-label="Seek position" type="range" min={0} max={duration || 1} step={0.1} value={Math.min(position, duration || 1)}
            onChange={e => { if (audio.current) audio.current.currentTime = Number(e.target.value); }} className="min-w-0 flex-1 accent-violet-500" />
          <span>{clock(duration)}</span>
        </div>
        <button aria-label="Close player" onClick={() => { audio.current?.pause(); setSelected(null); setPlaying(false); }} className="rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-white">✕</button>
      </div>
      <audio ref={audio} src={supabase.storage.from("tracks").getPublicUrl(selected.audio_path).data.publicUrl}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={e => setPosition(e.currentTarget.currentTime)}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)} onEnded={() => skip(1)} onError={() => setError("This audio file could not be loaded.")} />
    </div>}
  </main>;
}
