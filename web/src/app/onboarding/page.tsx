
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const roleOptions = ["artist", "producer", "curator"] as const;
type Role = (typeof roleOptions)[number];

export default function OnboardingPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkUser() {
      const { data, error: authError } =
        await supabase.auth.getUser();

      if (!active) return;

      if (authError || !data.user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.user.id)
          .maybeSingle();

      if (!active) return;

      if (profileError) {
        setError(profileError.message);
      } else if (profile) {
        router.replace("/dashboard");
      } else {
        setChecking(false);
      }
    }

    checkUser();

    return () => {
      active = false;
    };
  }, [router]);

  function toggleRole(role: Role) {
    setRoles((current) =>
      current.includes(role)
        ? current.filter((r) => r !== role)
        : [...current, role]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cleanUsername = username.trim().toLowerCase();
    const cleanName = displayName.trim();

    if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      setError("Username must be 3–30 characters: letters, numbers or underscores.");
      return;
    }

    if (!cleanName || cleanName.length > 60 || roles.length === 0) {
      setError("Enter a display name and select at least one role.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } =
        await supabase.auth.getUser();

      if (authError || !data.user) {
        router.replace("/login");
        return;
      }

      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          username: cleanUsername,
          display_name: cleanName,
          roles,
        });

      if (insertError) {
        setError(
          insertError.code === "23505"
            ? "That username is already taken, or you already have a profile."
            : insertError.message
        );
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-[#09090f] text-white flex items-center justify-center">
        {error || "Checking your Nexus account..."}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090f] text-white flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#14121e] p-8 space-y-6"
      >
        <h1 className="text-3xl font-bold">
          Welcome to <span className="text-violet-500">NEXUS.</span>
        </h1>

        <p className="text-gray-400">
          Set up your creator profile to get started.
        </p>

        <div>
          <label className="block mb-2">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_username"
            maxLength={30}
            required
            className="w-full rounded-lg bg-black/40 border border-white/20 p-3"
          />
        </div>

        <div>
          <label className="block mb-2">Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your artist or creator name"
            maxLength={60}
            required
            className="w-full rounded-lg bg-black/40 border border-white/20 p-3"
          />
        </div>

        <div>
          <p className="mb-3">I am a...</p>
          <div className="flex flex-wrap gap-3">
            {roleOptions.map((role) => (
              <button
                key={role}
                type="button"
                aria-pressed={roles.includes(role)}
                onClick={() => toggleRole(role)}
                className={`rounded-lg px-4 py-3 border capitalize ${
                  roles.includes(role)
                    ? "bg-violet-700 border-violet-500"
                    : "border-white/20 bg-black/30"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            You can select multiple roles.
          </p>
        </div>

        {error && <p role="alert" className="text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-violet-600 p-4 font-semibold disabled:opacity-50"
        >
          {loading ? "Creating profile..." : "Create My Profile"}
        </button>
      </form>
    </main>
  );
}
