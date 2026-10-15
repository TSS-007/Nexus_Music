
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  username: string;
  display_name: string;
  roles: string[];
  avatar_url?: string | null;
  bio?: string | null;
  music_links?: Record<string, string> | null;
};

export default function CreatorProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        if (active) setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("username, display_name, roles, avatar_url, bio, music_links")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error("Profile loading failed:", error.message);
      }

      setProfile(data);
      setLoading(false);
    }

    void loadProfile();
    const refresh = () => { void loadProfile(); };
    window.addEventListener("focus", refresh);

    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
    };
  }, []);

  if (loading) {
    return <p className="text-gray-400">Loading profile...</p>;
  }

  if (!profile) {
    return (
      <p className="text-gray-400">
        No creator profile found.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {profile.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.avatar_url} alt="Creator avatar" className="h-14 w-14 rounded-full object-cover" />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-700 text-2xl font-bold text-white">
          {profile.display_name.charAt(0).toUpperCase()}
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-white">
          Welcome back, {profile.display_name}
        </h2>

        <p className="text-sm text-gray-400">
          @{profile.username} ·{" "}
          {profile.roles
            .map((role) =>
              role.charAt(0).toUpperCase() + role.slice(1)
            )
            .join(", ")}
        </p>
        {profile.bio && <p className="mt-2 max-w-md whitespace-pre-wrap text-sm text-gray-300">{profile.bio}</p>}
        {profile.music_links && <div className="mt-2 flex flex-wrap gap-3">
          {Object.entries(profile.music_links).filter(([, url]) => {
            try { return ["http:", "https:"].includes(new URL(url).protocol); } catch { return false; }
          }).map(([name, url]) => (
            <a key={name} href={url} target="_blank" rel="noopener noreferrer"
              className="text-sm capitalize text-violet-300 underline">{name}</a>
          ))}
        </div>}
      </div>
    </div>
  );
}

