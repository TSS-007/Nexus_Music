"use client";

import NexusHover from "@/app/components/NexusHover";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const genres = ["Trap", "Drill", "Hip-Hop", "R&B", "Pop", "Electronic", "Indie", "Ambient", "Other"];
const accepted = ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/wav", "audio/wave", "audio/x-wav", "audio/ogg"];
export default function UploadPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("Trap");
  const [kind, setKind] = useState<"song" | "beat">("song");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (!data.user) { router.replace("/login"); return; }
      setUserId(data.user.id); setLoading(false);
    });
    return () => { active = false; };
  }, [router]);
  async function publish(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setStatus("");
    if (!userId || !file) { setError("Choose an audio file first."); return; }
    if (!title.trim() || title.trim().length > 120) { setError("Track title must be 1–120 characters."); return; }
    if (!accepted.includes(file.type) || file.size > 20 * 1024 * 1024 || file.size === 0) {
      setError("Choose an MP3, WAV, M4A or OGG file smaller than 20 MB."); return;
    }
    setBusy(true);
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user?.id !== userId) { setBusy(false); router.replace("/login"); return; }
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["mp3", "wav", "m4a", "mp4", "ogg"].includes(extension)) {
      setError("Unsupported audio extension."); setBusy(false); return;
    }
    const path = userId + "/" + crypto.randomUUID() + "." + extension;
    setStatus("Uploading audio...");
    const { error: uploadError } = await supabase.storage.from("tracks").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) { setError("Upload failed: " + uploadError.message); setStatus(""); setBusy(false); return; }
    setStatus("Publishing track...");
    const { error: insertError } = await supabase.from("tracks").insert({ owner_id: userId, title: title.trim(), genre, kind, description: description.trim(), audio_path: path });
    if (insertError) {
      await supabase.storage.from("tracks").remove([path]);
      setError("Publishing failed: " + insertError.message); setStatus(""); setBusy(false); return;
    }
    setStatus("Published! Opening music library...");
    router.push("/music");
  }
  return <main className="min-h-screen bg-[#070711] px-5 py-10 text-white">
    <div className="mx-auto max-w-2xl">
      <nav className="mb-12 flex items-center justify-between"><NexusHover><Link href="/" className="text-2xl font-black tracking-widest">NEXUS<span className="text-violet-500">.</span></Link></NexusHover><NexusHover><Link href="/music" className="text-sm text-violet-300 transition hover:text-white">← Music library</Link></NexusHover></nav>
      <h1 className="text-4xl font-black">Upload your sound.</h1>
      <p className="mt-3 text-gray-400">Publish a song or beat to the Nexus community. Only upload music you own or have permission to share. Published audio is publicly accessible.</p>
      {loading ? <p className="mt-10 text-gray-400">Checking your account...</p> : <form onSubmit={e => void publish(e)} className="mt-9 space-y-6 rounded-3xl border border-white/10 bg-[#121020] p-6 sm:p-9">
        <div><label htmlFor="audio" className="mb-2 block text-sm font-semibold">Audio file</label>
          <input id="audio" required type="file" accept=".mp3,.wav,.m4a,.mp4,.ogg,audio/*" onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="block w-full rounded-xl border border-dashed border-violet-500/40 bg-violet-500/5 p-5 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-white" />
          <p className="mt-2 text-xs text-gray-400">{file ? file.name + " · " + (file.size / 1024 / 1024).toFixed(1) + " MB" : "MP3, WAV, M4A or OGG · max 20 MB"}</p>
        </div>
        <div><label htmlFor="title" className="mb-2 block text-sm font-semibold">Track title</label><input id="title" required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder="Name your track..." className="w-full rounded-xl border border-white/15 bg-[#070711] px-4 py-3 outline-none transition focus:border-violet-400" /></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label htmlFor="genre" className="mb-2 block text-sm font-semibold">Genre</label><select id="genre" value={genre} onChange={e => setGenre(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#070711] px-4 py-3">{genres.map(g => <option key={g}>{g}</option>)}</select></div>
          <div><label htmlFor="kind" className="mb-2 block text-sm font-semibold">Type</label><select id="kind" value={kind} onChange={e => setKind(e.target.value as "song" | "beat")} className="w-full rounded-xl border border-white/15 bg-[#070711] px-4 py-3"><option value="song">Song</option><option value="beat">Beat</option></select></div>
        </div>
        <div><label htmlFor="description" className="mb-2 block text-sm font-semibold">Description (optional)</label><textarea id="description" maxLength={1000} rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell listeners about this track..." className="w-full rounded-xl border border-white/15 bg-[#070711] px-4 py-3 outline-none transition focus:border-violet-400" /></div>
        {error && <p role="alert" className="rounded-xl border border-red-500/40 p-3 text-sm text-red-300">{error}</p>}
        {status && <p role="status" className="rounded-xl border border-violet-500/30 p-3 text-sm text-violet-200">{status}</p>}
        <button disabled={busy || !file || !title.trim()} type="submit" className="w-full rounded-xl bg-violet-600 px-6 py-4 font-semibold transition hover:-translate-y-0.5 hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Publishing..." : "Publish track →"}</button>
      </form>}
    </div>
  </main>;
}
