
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  username: string;
  display_name: string;
  roles: string[];
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
        .select("username, display_name, roles")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error("Profile loading failed:", error.message);
      }

      setProfile(data);
      setLoading(false);
    }

    loadProfile();

    return () => {
      active = false;
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
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-700 text-2xl font-bold text-white">
        {profile.display_name.charAt(0).toUpperCase()}
      </div>

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
      </div>
    </div>
  );
}

