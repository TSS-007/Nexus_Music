import Link from "next/link";
import AccountInfo from "./AccountInfo";
import CreatorProfile from "./CreatorProfile";

const navigation = [
  { icon: "◫", label: "Overview", href: "/dashboard" },
  { icon: "♫", label: "Discover Music", href: "/discover" },




  { icon: "♙", label: "My Profile", href: "/profile" },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#080810] text-white">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-white/10 bg-[#0d0d18] p-6 lg:block">

        <Link href="/" className="text-2xl font-black tracking-widest">
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
        <AccountInfo />

        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-6 lg:px-10">

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
          <section className="mb-10 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-950/70 to-[#151526] p-8">

            <p className="mb-3 text-sm font-semibold text-violet-300">
              YOUR CREATIVE HUB
            </p>

            <h2 className="text-3xl font-bold">
              Your next opportunity starts here.
            </h2>

            <p className="mt-4 max-w-xl text-gray-400">
              Discover music, connect with creators, and grow your
              network through meaningful collaboration.
            </p>

            <Link
              href="/discover"
              className="mt-6 inline-block rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold hover:bg-violet-500"
            >
              Explore Music →
            </Link>
          </section>

          {/* Real activity replaces the former demonstration numbers. */}
          <section className="mb-10 grid gap-4 sm:grid-cols-2">
            <Link href="/discover" className="group rounded-2xl border border-white/10 bg-[#11111d] p-6 transition duration-200 hover:-translate-y-1 hover:border-violet-500/60 hover:shadow-lg hover:shadow-violet-900/20">
              <p className="text-sm text-gray-400">Community</p>
              <h3 className="mt-3 text-xl font-bold">Discover creators ↗</h3>
              <p className="mt-2 text-sm text-gray-400">Search and filter real artists, producers and curators.</p>
            </Link>
            <Link href="/profile" className="group rounded-2xl border border-white/10 bg-[#11111d] p-6 transition duration-200 hover:-translate-y-1 hover:border-violet-500/60 hover:shadow-lg hover:shadow-violet-900/20">
              <p className="text-sm text-gray-400">Your identity</p>
              <h3 className="mt-3 text-xl font-bold">Edit your profile ↗</h3>
              <p className="mt-2 text-sm text-gray-400">Update your bio, picture and music links.</p>
            </Link>
          </section>
          <section className="rounded-2xl border border-violet-500/20 bg-[#11111d] p-6">
            <h2 className="text-lg font-semibold">More Nexus features are coming</h2>
            <p className="mt-2 text-sm text-gray-400">Campaigns, marketplace listings, credits and messages are not active yet. We won't show made-up submissions, balances or trending tracks.</p>
          </section>
        </div>
      </div>
    </div>
  );
}