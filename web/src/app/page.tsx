"use client";
import { useState } from "react";
import Link from "next/link";
const paths = [
  { number:"01", icon:"♫", title:"Artists", description:"Release your sound. Find collaborators and get your music heard.", href:"/music", action:"Explore music" },
  { number:"02", icon:"◈", title:"Producers", description:"Share your beats. Build relationships with the artists who need your sound.", href:"/upload", action:"Upload a beat" },
  { number:"03", icon:"◎", title:"Curators", description:"Find new voices and connect with independent talent.", href:"/discover", action:"Discover creators" },
];
export default function Home() {
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const navFeedback = (name: string) => ({
    onPointerEnter: () => setHoveredNav(name),
    onPointerLeave: () => setHoveredNav(null),
    onPointerCancel: () => setHoveredNav(null),
    onFocus: () => setHoveredNav(name),
    onBlur: () => setHoveredNav(null),
    style: hoveredNav === name ? { backgroundColor: "rgba(139,92,246,.42)", color: "#fff", boxShadow: "inset 0 0 0 1px rgba(196,181,253,.7), 0 0 24px rgba(139,92,246,.38)" } : undefined,
  });
  return <main className="relative min-h-screen overflow-hidden bg-[#070711] text-white">
    <div aria-hidden className="nexus-glow pointer-events-none absolute inset-0" />
    <div aria-hidden className="nexus-grid pointer-events-none absolute inset-x-0 top-0 h-[850px]" />
    <div className="relative">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080810]/85 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8" aria-label="Main navigation">
          <Link href="/" className="text-2xl font-black tracking-[.17em]">NEXUS<span className="text-violet-400">.</span></Link>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm sm:gap-x-7">
            <Link href="/music" {...navFeedback("Music")} className="rounded-lg px-3 py-2 text-gray-300 transition hover:bg-violet-500/20 hover:text-violet-200 hover:ring-1 hover:ring-violet-400/30">Music</Link>
            <Link href="/discover" {...navFeedback("Creators")} className="rounded-lg px-3 py-2 text-gray-300 transition hover:bg-violet-500/20 hover:text-violet-200 hover:ring-1 hover:ring-violet-400/30">Creators</Link>
            <Link href="/dashboard" {...navFeedback("Dashboard")} className="hidden rounded-lg px-3 py-2 text-gray-300 transition hover:bg-violet-500/20 hover:text-violet-200 hover:ring-1 hover:ring-violet-400/30 sm:inline">Dashboard</Link>
            <Link href="/login" {...navFeedback("Log in")} className="rounded-lg px-3 py-2 text-gray-300 transition hover:bg-violet-500/20 hover:text-violet-200 hover:ring-1 hover:ring-violet-400/30">Log in</Link>
            <Link href="/signup" className="nexus-cta rounded-xl px-4 py-2.5 font-semibold">Join Nexus ↗</Link>
          </div>
        </nav>
      </header>
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-24 lg:grid-cols-[1.15fr_.85fr] lg:pb-36 lg:pt-32">
        <div className="nexus-reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[.18em] text-violet-200"><span className="h-2 w-2 rounded-full bg-violet-400" /> A network built for sound</span>
          <h1 className="mt-9 text-5xl font-black leading-[1.08] tracking-tight sm:text-7xl xl:text-[5.7rem]">Independent<br />sounds.<br /><span className="nexus-gradient-text">Infinite reach.</span></h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-gray-300">One place for artists, producers and curators to discover music, share work and build what comes next.</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/music" className="nexus-cta rounded-xl px-7 py-4 font-bold">Explore music <span aria-hidden>↗</span></Link>
            <Link href="/upload" className="rounded-xl border border-white/20 bg-white/5 px-7 py-4 font-semibold transition hover:-translate-y-0.5 hover:border-violet-400/60 hover:bg-white/10">Upload your sound</Link>
          </div>
          <p className="mt-9 text-xs uppercase tracking-[.18em] text-gray-500">Discover · Create · Connect</p>
        </div>
        <div className="nexus-reveal-delay relative mx-auto w-full max-w-lg">
          <div className="absolute -inset-6 rounded-[3rem] bg-violet-600/10 blur-3xl" />
          <div className="nexus-panel relative overflow-hidden rounded-[2rem] p-5 sm:p-7">
            <div className="flex items-center justify-between border-b border-white/10 pb-5"><span className="text-xs font-bold uppercase tracking-[.2em] text-violet-300">The Nexus frequency</span><span className="flex items-center gap-2 text-xs text-gray-400"><span className="h-2 w-2 rounded-full bg-emerald-400" /> On air</span></div>
            <div className="my-8 flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-violet-400/20 bg-[radial-gradient(circle_at_50%_40%,#6d28d9_0%,#2e1065_33%,#0b0917_75%)]">
              <div aria-hidden className="relative flex h-52 w-52 items-center justify-center rounded-full border border-violet-300/20 sm:h-64 sm:w-64">
                <div className="absolute inset-6 rounded-full border border-fuchsia-300/20" />
                <div className="absolute inset-14 rounded-full border border-violet-200/20" />
                <span className="text-7xl font-black text-white/85 drop-shadow-[0_0_35px_rgba(216,180,254,.8)]">N.</span>
              </div>
            </div>
            <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-widest text-violet-300">Find your next favorite</p><p className="mt-1 text-xl font-bold">The underground starts here</p></div><Link href="/music" aria-label="Browse music" className="nexus-cta flex h-12 w-12 items-center justify-center rounded-full text-xl">↗</Link></div>
          </div>
        </div>
      </section>
      <section id="features" className="mx-auto max-w-7xl px-6 pb-28">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-violet-300">Made for the independent</p><h2 className="mt-3 text-3xl font-black sm:text-5xl">Your scene. Your space.</h2></div><Link href="/discover" className="text-sm font-semibold text-violet-300 transition hover:text-white">Meet the community ↗</Link></div>
        <div className="grid gap-5 md:grid-cols-3">{paths.map(p => <Link href={p.href} key={p.title} className="nexus-panel nexus-panel-hover group rounded-3xl p-7"><div className="flex items-center justify-between"><span className="text-5xl text-violet-300">{p.icon}</span><span className="text-xs tracking-widest text-gray-500">{p.number} / 03</span></div><h3 className="mt-12 text-2xl font-bold">{p.title}</h3><p className="mt-3 min-h-20 leading-7 text-gray-400">{p.description}</p><span className="mt-7 inline-block text-sm font-semibold text-violet-300 transition group-hover:translate-x-1">{p.action} →</span></Link>)}</div>
      </section>
      <section className="border-y border-white/10 bg-violet-950/10 px-6 py-20 text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-violet-300">The next wave is independent</p><h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">Good music deserves to be discovered.</h2><p className="mx-auto mt-5 max-w-xl text-gray-400">Upload your tracks, discover new creators and grow your network.</p><Link href="/signup" className="nexus-cta mt-9 inline-block rounded-xl px-7 py-4 font-bold">Create your account ↗</Link></section>
      <footer className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 px-6 py-9 text-sm text-gray-500"><span className="font-black tracking-widest text-white">NEXUS<span className="text-violet-400">.</span></span><span>© 2026 Nexus Music · Built for independent creators.</span></footer>
    </div>
  </main>;
}
