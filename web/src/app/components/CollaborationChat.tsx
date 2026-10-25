"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import ChatAudioPreview from "@/app/components/ChatAudioPreview";

type Message = {
  id: string; sender_id: string; body: string; created_at: string;
  file_path: string | null; file_name: string | null; file_size: number | null;
};
type Pending = { id: string; body: string; file: File | null; uploaded: boolean };
const BUCKET = "collaboration-files";
const MAX_FILE = 50 * 1024 * 1024;
function errorText(error: unknown) {
  return error && typeof error === "object" && "message" in error ? String(error.message) : "Something went wrong. Please try again.";
}
function fileSize(bytes: number) { return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }

export default function CollaborationChat({ requestId, userId, otherName }: { requestId: string; userId: string; otherName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(false);
  const [loading, setLoading] = useState(true);
  const [readError, setReadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [limit, setLimit] = useState(50);
  const [more, setMore] = useState(false);
  const [downloading, setDownloading] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "live" | "fallback">("connecting");
  const pending = useRef<Pending | null>(null);
  const sending = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const lastMessage = useRef("");
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    const current = ++generation.current;
    try {
      const auth = await supabase.auth.getUser();
      if (auth.error) throw auth.error;
      if (auth.data.user?.id !== userId) throw new Error("Your account changed. Reload this page to continue.");
      const access = await supabase.rpc("can_access_collaboration_chat", { p_request: requestId });
      if (access.error) throw access.error;
      if (!access.data) throw new Error("This conversation is no longer available.");
      const result = await supabase.from("collaboration_messages")
        .select("id,sender_id,body,created_at,file_path,file_name,file_size")
        .eq("request_id", requestId).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(limit + 1);
      if (result.error) throw result.error;
      if (current !== generation.current) return;
      const rows = (result.data ?? []) as Message[];
      setMore(rows.length > limit);
      setMessages(rows.slice(0, limit).reverse());
      setAuthorized(true);
      setReadError("");
    } catch (err) {
      if (current !== generation.current) return;
      setAuthorized(false);
      setMessages([]);
      setReadError(errorText(err));
    } finally { if (current === generation.current) setLoading(false); }
  }, [requestId, userId, limit]);

  const invalidate = useCallback(() => { generation.current++; }, []);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      await refresh();
      if (!stopped) timer = setTimeout(poll, 5000);
    };
    void poll();
    return () => { stopped = true; clearTimeout(timer); invalidate(); };
  }, [refresh, invalidate]);

  // Realtime wakes the existing permission-checked refresh; the five-second
  // polling loop above remains a safety net for dropped or blocked sockets.
  useEffect(() => {
    if (!authorized) {
      setRealtimeStatus("fallback");
      return;
    }
    let active = true;
    setRealtimeStatus("connecting");
    const channel = supabase
      .channel("collaboration-messages-" + requestId + "-" + crypto.randomUUID())
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "collaboration_messages",
        filter: "request_id=eq." + requestId,
      }, () => { if (active) void refresh(); })
      .subscribe(status => {
        if (!active) return;
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("live");
          void refresh();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setRealtimeStatus("fallback");
        } else {
          setRealtimeStatus("connecting");
        }
      });
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [authorized, requestId, refresh]);

  useEffect(() => {
    const latest = messages.at(-1)?.id ?? "";
    const el = scroller.current;
    if (el && latest !== lastMessage.current) {
      if (!lastMessage.current || el.scrollHeight - el.scrollTop - el.clientHeight < 180 || messages.at(-1)?.sender_id === userId) el.scrollTop = el.scrollHeight;
      lastMessage.current = latest;
    }
  }, [messages, userId]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (sending.current || !authorized) return;
    if (!pending.current && !body.trim() && !file) return;
    sending.current = true; setBusy(true); setError(""); setNotice("");
    const draft = pending.current ?? { id: crypto.randomUUID(), body: body.trim(), file, uploaded: false };
    pending.current = draft;
    try {
      const auth = await supabase.auth.getUser();
      if (auth.error || auth.data.user?.id !== userId) throw new Error("Please sign in again before sending.");
      if (draft.file && !draft.uploaded) {
        const path = `${requestId}/${userId}/${draft.id}`;
        const result = await supabase.storage.from(BUCKET).upload(path, draft.file, { upsert: false, contentType: "application/octet-stream" });
        // A lost upload response can leave the object saved. Never overwrite it;
        // the RPC below verifies its existence and membership before publication.
        if (result.error && result.error.message !== "The resource already exists") throw result.error;
        draft.uploaded = true;
      }
      const result = await supabase.rpc("send_collaboration_message", {
        p_id: draft.id, p_request: requestId, p_body: draft.body, p_file_name: draft.file?.name ?? null,
      });
      if (result.error) throw result.error;
      pending.current = null; setRetry(false); setBody(""); setFile(null);
      if (input.current) input.current.value = "";
      setNotice("Message sent.");
      await refresh();
    } catch (err) { setRetry(true); setError(`${errorText(err)} Your draft is kept; retry sends the same message without duplicating it.`); }
    finally { sending.current = false; setBusy(false); }
  }

  async function download(message: Message) {
    if (!message.file_path || !message.file_name) return;
    setDownloading(message.id); setError("");
    try {
      const result = await supabase.storage.from(BUCKET).download(message.file_path);
      if (result.error) throw result.error;
      const url = URL.createObjectURL(result.data);
      const link = document.createElement("a");
      link.href = url; link.download = message.file_name; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) { setError(errorText(err)); }
    finally { setDownloading(""); }
  }

  return <section className="mt-6 border-t border-white/10 pt-6" aria-label={"Conversation with " + otherName}>
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-violet-300/30 bg-violet-500/20 text-lg font-bold text-violet-100">
          {otherName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold">Chat with {otherName}</h3>
          <p className="text-xs text-gray-400">Your private collaboration conversation</p>
        </div>
      </div>
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
        <span aria-hidden="true" className={"size-1.5 rounded-full " + (realtimeStatus === "live" ? "bg-emerald-400" : "bg-amber-400")} />
        {realtimeStatus === "live" ? "Live updates" : realtimeStatus === "connecting" ? "Connecting live updates…" : "Auto-refresh every 5 seconds"}
      </span>
    </header>
    {readError && <p role="alert" className="mt-4 text-sm text-red-300">Could not load chat: {readError} <button type="button" onClick={() => void refresh()} className="underline">Retry</button></p>}
    <div
      ref={scroller}
      className="mt-4 max-h-[32rem] min-h-48 space-y-4 overflow-y-auto rounded-2xl border border-white/10 bg-[#090814]/80 p-3 sm:p-5"
      aria-label="Messages"
      tabIndex={0}
    >
      {loading ? <p className="text-sm text-gray-400">Loading conversation…</p> : authorized && messages.length === 0 ? <div className="py-6 text-center">
        <p className="font-semibold text-gray-200">Start the conversation</p>
        <p className="mt-1 text-sm text-gray-400">Send a message or share your first demo.</p>
      </div> : null}
      {more && <div className="text-center"><button type="button" onClick={() => setLimit(value => value + 50)} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-violet-200 hover:bg-white/10">Load older messages</button></div>}
      {messages.map((message, index) => {
        const mine = message.sender_id === userId;
        const day = new Date(message.created_at).toDateString();
        const previousDay = index > 0 ? new Date(messages[index - 1].created_at).toDateString() : "";
        return <div key={message.id}>
          {day !== previousDay && <div className="mb-4 flex items-center gap-3 text-xs text-gray-500">
            <div className="h-px flex-1 bg-white/10" />
            <time dateTime={message.created_at}>{new Date(message.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time>
            <div className="h-px flex-1 bg-white/10" />
          </div>}
          <div className={mine ? "flex justify-end" : "flex justify-start"}>
            <article className={"min-w-0 max-w-[95%] rounded-2xl border px-4 py-3 sm:max-w-[82%] " + (mine
              ? "rounded-br-sm border-violet-400/25 bg-violet-500/20"
              : "rounded-bl-sm border-white/10 bg-[#211d34]")}>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs">
                <strong className={mine ? "text-violet-200" : "text-gray-100"}>{mine ? "You" : otherName}</strong>
                <time dateTime={message.created_at} title={new Date(message.created_at).toLocaleString()} className="text-gray-400">
                  {new Date(message.created_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </time>
              </div>
              {message.body && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-100">{message.body}</p>}
              {message.file_path && message.file_name && <div className="mt-3 min-w-0 rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-400/15 text-lg text-violet-200">♫</span>
                  <div className="min-w-0">
                    <p className="break-all text-sm font-semibold text-gray-100">{message.file_name}</p>
                    <p className="text-xs text-gray-400">{fileSize(message.file_size ?? 0)}</p>
                  </div>
                </div>
                {/[.](wav|mp3)$/i.test(message.file_name) && <ChatAudioPreview filePath={message.file_path} fileName={message.file_name} />}
                <button
                  type="button"
                  disabled={!!downloading}
                  onClick={() => void download(message)}
                  className="mt-3 rounded-lg border border-white/15 px-3 py-2 text-left text-sm text-violet-200 hover:bg-violet-500/15 disabled:opacity-50"
                >{downloading === message.id ? "Downloading…" : "↓ Download file"}</button>
              </div>}
            </article>
          </div>
        </div>;
      })}
    </div>
    <form onSubmit={send} className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
      <label className="block text-sm font-medium text-gray-200">Message
        <textarea
          value={body}
          onChange={event => setBody(event.target.value)}
          maxLength={4000}
          disabled={busy || retry || !authorized}
          rows={2}
          placeholder="Share an idea, send a demo, or plan your next session…"
          className="mt-2 block w-full resize-y rounded-xl border border-white/15 bg-[#171429] p-3 text-white placeholder:text-gray-500 disabled:opacity-50"
        />
      </label>
      <label className="block text-sm text-gray-300">Attach a file <span className="text-gray-400">(up to 50 MB)</span>
        <input ref={input} type="file" disabled={busy || retry || !authorized} className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-500/20 file:px-3 file:py-2 file:text-violet-200" onChange={event => {
          const selected = event.target.files?.[0] ?? null; setError("");
          if (selected && (selected.size === 0 || selected.size > MAX_FILE || selected.name.length > 255)) { setError("Choose a non-empty file up to 50 MB with a filename under 256 characters."); event.target.value = ""; setFile(null); return; }
          setFile(selected);
        }} />
      </label>
      {file && <p className="break-all rounded-lg bg-violet-500/10 px-3 py-2 text-sm text-violet-200">{file.name} · {fileSize(file.size)} {!busy && !retry && <button type="button" className="ml-3 underline" onClick={() => { setFile(null); if (input.current) input.current.value = ""; }}>Remove</button>}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-gray-400">Text, WAV/MP3, stems, ZIPs, images, or documents</span>
        <button type="submit" disabled={busy || !authorized || (!retry && !body.trim() && !file)} className="nexus-cta rounded-xl px-5 py-3 font-semibold disabled:opacity-40">{busy ? "Sending…" : retry ? "Retry send" : "Send message"}</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <p role="status" className="text-sm text-violet-200">{notice}</p>
    </form>
  </section>;
}
