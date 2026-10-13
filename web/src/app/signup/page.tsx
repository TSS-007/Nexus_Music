"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        "Account request submitted! Check your email for a confirmation link."
      );
    }

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080810] px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#11111d] p-8">
        <Link href="/" className="text-3xl font-black tracking-widest">
          NEXUS<span className="text-violet-500">.</span>
        </Link>

        <h1 className="mt-10 text-3xl font-bold">
          Join the network.
        </h1>

        <p className="mt-3 text-gray-400">
          Create your account and start connecting with independent creators.
        </p>

        <form onSubmit={handleSignup} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-gray-400">
              Email address
            </label>

            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#080810] px-4 py-3 outline-none focus:border-violet-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm text-gray-400">
              Password
            </label>

            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#080810] px-4 py-3 outline-none focus:border-violet-500"
              placeholder="At least 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 py-3 font-semibold transition hover:bg-violet-500 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {message && (
          <p role="status" className="mt-5 text-sm text-violet-300">
            {message}
          </p>
        )}

        <p className="mt-8 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}