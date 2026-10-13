"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AccountInfo() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        setEmail(data.user.email ?? null);
      }
    }

    loadUser();
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#11111d] p-6 text-white">
      <h2 className="text-xl font-bold">Your Nexus Account</h2>

      <p className="mt-3 text-gray-400">
        Logged in as:
      </p>

      <p className="mt-1 font-semibold text-violet-400">
        {email ?? "Loading account..."}
      </p>
    </div>
  );
}
