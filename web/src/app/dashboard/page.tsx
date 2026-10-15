import Link from "next/link";
import AccountInfo from "./AccountInfo";
import CreatorProfile from "./CreatorProfile";

const navigation = [
  { icon: "◫", label: "Overview", href: "/dashboard" },
  { icon: "♫", label: "Discover Music", href: "/music" },
  { icon: "◉", label: "Find Creators", href: "/discover" },
  { icon: "↑", label: "Upload Music", href: "/upload" },




  { icon: "♙", label: "My Profile", href: "/profile" },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#070711] text-white">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-white/10 bg-[#0c0b19]/95 p-6 backdrop-blur-xl lg:block">

        <Link href="/" className="text-2xl font-black tracking-[.17em]">
          NEXUS<span className="text-violet-500">.</span>
        </Link>

        <div className="mt-12 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 rounded-xl px-4 py-3 text-sm transition ${
                item.label === "Overview"
                  ? "bg-violet-600/20 text-violet-300"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="absolute bottom-8 left-6 right-6 rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
          <p className="text-sm font-semibold">Nexus Creator</p>
          <p className="mt-1 text-xs text-gray-400">
            Your creative journey starts here.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-3 lg:hidden"><Link href="/" className="font-black tracking-widest">NEXUS<span className="text-violet-400">.</span></Link><div className="flex flex-wrap gap-3 text-xs"><Link href="/music">Music</Link><Link href="/discover">Creators</Link><Link href="/upload">Upload</Link><Link href="/profile">Profile</Link></div></div>
        <AccountInfo />

        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#100e20]/60 px-6 py-6 backdrop-blur-lg lg:px-10">

          <div>
            <p className="text-sm text-gray-400">Creator Dashboard</p>
            <h1 className="text-2xl font-bold">Overview</h1>
          </div>

          <div className="flex items-center gap-4">
            <CreatorProfile />
          </div>
        </header>

        <div className="mx-auto max-w-7xl p-6 lg:p-10">

          {/* Welcome */}
          <section className="nexus-reveal relative mb-10 overflow-hidden rounded-3xl border border-violet-500/25 bg-[radial-gradient(ellipse_at_top_right,#4c1d95_0%,#1c1436_45%,#10101e_100%)] p-8 sm:p-12">

            <p className="mb-3 text-sm font-semibold text-violet-300">
              YOUR CREATIVE HUB
            </p>

            <h2 className="max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">
              Your next opportunity starts here.
            </h2>

            <p className="mt-4 max-w-xl text-gray-400">
              Discover music, connect with creators, and grow your
              network through meaningful collaboration.
            </p>

            <Link
              href="/music"
              className="nexus-cta mt-7 inline-block rounded-xl px-6 py-3 text-sm font-semibold"
            >
              Explore Music →
            </Link>
          </section>

          {/* Real activity replaces the former demonstration numbers. */}
          <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/music" className="nexus-panel nexus-panel-hover group rounded-2xl p-7">
              <p className="text-sm text-gray-400">Community</p>
              <h3 className="mt-3 text-xl font-bold">Explore music ↗</h3>
              <p className="mt-2 text-sm text-gray-400">Listen to real songs and beats from Nexus creators.</p>
            </Link>
            <Link href="/profile" className="group rounded-2xl border border-white/10 bg-[#11111d] p-6 transition duration-200 hover:-translate-y-1 hover:border-violet-500/60 hover:shadow-lg hover:shadow-violet-900/20">
              <p className="text-sm text-gray-400">Your identity</p>
              <h3 className="mt-3 text-xl font-bold">Edit your profile ↗</h3>
              <p className="mt-2 text-sm text-gray-400">Update your bio, picture and music links.</p>
            </Link>
            <Link href="/upload" className="nexus-panel nexus-panel-hover group rounded-2xl p-7"><p className="text-sm text-gray-400">Create</p><h3 className="mt-3 text-xl font-bold">Upload a track ↗</h3><p className="mt-2 text-sm text-gray-400">Share a new song or beat with the community.</p></Link>
          </section>
          <section className="nexus-panel rounded-2xl p-7">
            <h2 className="text-lg font-semibold">More Nexus features are coming</h2>
            <p className="mt-2 text-sm text-gray-400">Campaigns, marketplace listings, credits and messages are not active yet. We won't show made-up submissions, balances or trending tracks.</p>
          </section>
        </div>
      </div>
    </div>
  );
}