"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      router.push("/dashboard");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <main className="nexus-glow flex min-h-screen items-center justify-center bg-[#070711] px-6 py-12 text-white">
      <div className="nexus-panel nexus-reveal w-full max-w-md rounded-3xl p-8 sm:p-10">
        <Link href="/" className="text-3xl font-black tracking-widest">
          NEXUS<span className="text-violet-500">.</span>
        </Link>

        <h1 className="mt-10 text-3xl font-bold">
          Welcome back.
        </h1>

        <p className="mt-3 text-gray-400">
          Sign in to your Nexus account.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
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
              className="w-full rounded-xl border border-white/10 bg-[#070711] px-4 py-3 outline-none focus:border-violet-500"
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070711] px-4 py-3 outline-none focus:border-violet-500"
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="nexus-cta w-full rounded-xl py-3 font-semibold disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {message && (
          <p role="alert" className="mt-5 text-sm text-red-400">
            {message}
          </p>
        )}

        <p className="mt-8 text-center text-sm text-gray-400">
          New to Nexus?{" "}
          <Link href="/signup" className="text-violet-400 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}