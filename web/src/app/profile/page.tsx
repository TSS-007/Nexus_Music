"use client";

import NexusHover from "@/app/components/NexusHover";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const availableRoles = ["artist", "producer", "curator"] as const;
type Profile = { username: string; display_name: string; roles: string[]; bio: string; avatar_url: string; music_links: Record<string, string> };

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>({ username: "", display_name: "", roles: [], bio: "", avatar_url: "", music_links: {} });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError || !auth.user) {
        window.location.replace("/login");
        return;
      }
      setUserId(auth.user.id);
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("username, display_name, roles, bio, avatar_url, music_links")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (!active) return;
      if (profileError) setError(profileError.message);
      else if (data) setProfile({
        username: data.username ?? "",
        display_name: data.display_name ?? "",
        roles: Array.isArray(data.roles) ? data.roles : [],
        bio: data.bio ?? "", avatar_url: data.avatar_url ?? "", music_links: data.music_links ?? {},
      });
      else setError("No creator profile found. Complete onboarding first.");
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);

  function toggleRole(role: string) {
    setProfile((current) => ({
      ...current,
      roles: current.roles.includes(role)
        ? current.roles.filter((r) => r !== role)
        : [...current.roles, role],
    }));
  }


  async function uploadAvatar(file?: File) {
    if (!file || !userId) return;
    setError(""); setMessage("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError("Use a JPG, PNG or WebP under 2 MB."); return;
    }
    setUploading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user?.id !== userId) { setUploading(false); window.location.replace("/login"); return; }
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = userId + "/avatar." + ext;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) setError(uploadError.message);
    else {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setProfile(p => ({ ...p, avatar_url: data.publicUrl + "?v=" + Date.now() }));
      setMessage("Photo uploaded. Save changes to update your profile.");
    }
    setUploading(false);
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId || saving) return;
    setError("");
    setMessage("");
    const username = profile.username.trim().toLowerCase();
    const display_name = profile.display_name.trim();
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      setError("Username must be 3–30 characters: lowercase letters, numbers, or underscores.");
      return;
    }
    if (!display_name || display_name.length > 60 || profile.roles.length === 0) {
      setError("Enter a display name (up to 60 characters) and select at least one role.");
      return;
    }
    if (profile.bio.length > 500) { setError("Bio must be 500 characters or fewer."); return; }
    const music_links: Record<string, string> = {};
    for (const [platform, raw] of Object.entries(profile.music_links)) {
      const value = raw.trim();
      if (!value) continue;
      try {
        const url = new URL(value);
        if (!["https:", "http:"].includes(url.protocol)) throw new Error("Invalid protocol");
        music_links[platform] = url.toString();
      } catch { setError("Enter a valid URL for " + platform); return; }
    }
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user || auth.user.id !== userId) {
      setSaving(false);
      window.location.replace("/login");
      return;
    }
    const { error: saveError } = await supabase.from("profiles")
      .update({ username, display_name, roles: profile.roles, bio: profile.bio.trim(), avatar_url: profile.avatar_url || null, music_links })
      .eq("id", userId)
      .select("id")
      .single();
    setSaving(false);
    if (saveError) setError(saveError.message);
    else {
      setProfile((p) => ({ ...p, username, display_name, music_links }));
      setMessage("Profile updated successfully.");
    }
  }

  return (
    <main className="min-h-screen bg-[#080810] px-5 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <NexusHover><Link href="/dashboard" className="text-sm text-violet-300 hover:text-violet-200">← Back to dashboard</Link></NexusHover>
        <h1 className="mt-8 text-3xl font-bold">My Profile</h1>
        <p className="mt-2 text-gray-400">Manage how other creators see you on Nexus.</p>
        {loading ? <p className="mt-8 text-gray-400">Loading your profile...</p> : (
          <form onSubmit={save} className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-[#11111d] p-6 sm:p-8">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium">Username</label>
              <input id="username" required maxLength={30} value={profile.username}
                onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
                className="w-full rounded-xl border border-white/15 bg-[#080810] px-4 py-3 outline-none focus:border-violet-500" />
              <p className="mt-2 text-xs text-gray-400">3–30 characters, lowercase letters, numbers and underscores.</p>
            </div>
            <div>
              <label htmlFor="displayName" className="mb-2 block text-sm font-medium">Display name</label>
              <input id="displayName" required maxLength={60} value={profile.display_name}
                onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
                className="w-full rounded-xl border border-white/15 bg-[#080810] px-4 py-3 outline-none focus:border-violet-500" />
            </div>

            <div>
              <label htmlFor="avatar" className="mb-2 block text-sm font-medium">Profile picture</label>
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="Profile avatar" className="mb-3 h-20 w-20 rounded-full object-cover" />
              ) : <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-violet-700 text-2xl">{profile.display_name.charAt(0).toUpperCase() || "N"}</div>}
              <input id="avatar" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading}
                onChange={(e) => void uploadAvatar(e.target.files?.[0])} className="block w-full text-sm text-gray-300" />
              <p className="mt-2 text-xs text-gray-400">JPG, PNG or WebP, maximum 2 MB. Upload, then save.</p>
            </div>
            <div>
              <label htmlFor="bio" className="mb-2 block text-sm font-medium">Bio</label>
              <textarea id="bio" maxLength={500} rows={4} value={profile.bio}
                onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
                placeholder="Tell creators about your music..."
                className="w-full rounded-xl border border-white/15 bg-[#080810] px-4 py-3 outline-none focus:border-violet-500" />
              <p className="text-right text-xs text-gray-400">{profile.bio.length}/500</p>
            </div>
            <fieldset>
              <legend className="mb-3 text-sm font-medium">Music links</legend>
              {(["spotify", "soundcloud", "beatstars", "youtube", "website"] as const).map(platform => (
                <div key={platform} className="mb-3">
                  <label htmlFor={platform} className="mb-1 block text-sm capitalize">{platform}</label>
                  <input id={platform} type="url" placeholder="https://" value={profile.music_links[platform] ?? ""}
                    onChange={(e) => setProfile(p => ({ ...p, music_links: { ...p.music_links, [platform]: e.target.value } }))}
                    className="w-full rounded-xl border border-white/15 bg-[#080810] px-4 py-3 outline-none focus:border-violet-500" />
                </div>
              ))}
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-sm font-medium">Creator roles</legend>
              <div className="flex flex-wrap gap-3">
                {availableRoles.map((role) => (
                  <label key={role} className={`cursor-pointer rounded-xl border px-4 py-3 text-sm ${profile.roles.includes(role) ? "border-violet-500 bg-violet-700/30" : "border-white/15"}`}>
                    <input type="checkbox" checked={profile.roles.includes(role)}
                      onChange={() => toggleRole(role)} className="mr-2 accent-violet-500" />
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </label>
                ))}
              </div>
            </fieldset>
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            {message && <p role="status" className="text-sm text-green-400">{message}</p>}
            <button disabled={saving || uploading || !userId} type="submit"
              className="rounded-xl bg-violet-600 px-6 py-3 font-semibold hover:bg-violet-500 disabled:opacity-50">
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
