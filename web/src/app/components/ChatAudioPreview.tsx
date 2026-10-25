"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = { filePath: string; fileName: string };
const BUCKET = "collaboration-files";

// Files stay in the private bucket. A participant explicitly requests a local
// blob preview; no public URLs or long-lived signed links are exposed.
export default function ChatAudioPreview({ filePath, fileName }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  async function loadPreview() {
    if (loading || previewUrl) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: downloadError } = await supabase.storage.from(BUCKET).download(filePath);
      if (downloadError) throw downloadError;
      if (!data) throw new Error("Audio file unavailable.");
      const mime = /\.wav$/i.test(fileName) ? "audio/wav" : "audio/mpeg";
      const blob = data.slice(0, data.size, mime);
      const url = URL.createObjectURL(blob);
      if (!mounted.current) {
        URL.revokeObjectURL(url);
        return;
      }
      setPreviewUrl(url);
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : "Could not load audio preview.");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  return <div className="mt-3">
    {previewUrl ? <audio
      className="w-full max-w-sm"
      aria-label={"Audio preview of " + fileName}
      controls
      preload="metadata"
      src={previewUrl}
      onError={() => setError("This browser could not play the audio. You can still download the file.")}
    /> : <button
      type="button"
      onClick={() => void loadPreview()}
      disabled={loading}
      className="rounded-lg border border-violet-300/30 bg-violet-500/15 px-3 py-2 text-sm font-semibold text-violet-100 hover:bg-violet-500/25 disabled:cursor-wait disabled:opacity-60"
    >{loading ? "Loading audio…" : "▶ Preview audio"}</button>}
    {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
  </div>;
}
