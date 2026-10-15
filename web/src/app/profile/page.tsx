"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const availableRoles = ["Artist", "Producer", "Curator"] as const;
type Profile = { username: string; display_name: string; roles: string[] };

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>({ username: "", display_name: "", roles: [] });
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
        .select("username, display_name, roles")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (!active) return;
      if (profileError) setError(profileError.message);
      else if (data) setProfile({
        username: data.username ?? "",
        display_name: data.display_name ?? "",
        roles: Array.isArray(data.roles) ? data.roles : [],
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
    if (!display_name || display_name.length > 80 || profile.roles.length === 0) {
      setError("Enter a display name (up to 80 characters) and select at least one role.");
      return;
    }
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user || auth.user.id !== userId) {
      setSaving(false);
      window.location.replace("/login");
      return;
    }
    const { error: saveError } = await supabase.from("profiles")
      .update({ username, display_name, roles: profile.roles })
      .eq("id", userId)
      .select("id")
      .single();
    setSaving(false);
    if (saveError) setError(saveError.message);
    else {
      setProfile((p) => ({ ...p, username, display_name }));
      setMessage("Profile updated successfully.");
    }
  }

  return (
    <main className="min-h-screen bg-[#080810] px-5 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="text-sm text-violet-300 hover:text-violet-200">← Back to dashboard</Link>
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
              <input id="displayName" required maxLength={80} value={profile.display_name}
                onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
                className="w-full rounded-xl border border-white/15 bg-[#080810] px-4 py-3 outline-none focus:border-violet-500" />
            </div>
            <fieldset>
              <legend className="mb-3 text-sm font-medium">Creator roles</legend>
              <div className="flex flex-wrap gap-3">
                {availableRoles.map((role) => (
                  <label key={role} className={`cursor-pointer rounded-xl border px-4 py-3 text-sm ${profile.roles.includes(role) ? "border-violet-500 bg-violet-700/30" : "border-white/15"}`}>
                    <input type="checkbox" checked={profile.roles.includes(role)}
                      onChange={() => toggleRole(role)} className="mr-2 accent-violet-500" />
                    {role}
                  </label>
                ))}
              </div>
            </fieldset>
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            {message && <p role="status" className="text-sm text-green-400">{message}</p>}
            <button disabled={saving || !userId} type="submit"
              className="rounded-xl bg-violet-600 px-6 py-3 font-semibold hover:bg-violet-500 disabled:opacity-50">
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
