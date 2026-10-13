import Link from "next/link";

const navigation = [
  { icon: "◫", label: "Overview", href: "/dashboard" },
  { icon: "♫", label: "Discover Music", href: "/discover" },
  { icon: "◈", label: "Campaigns", href: "/campaigns" },
  { icon: "◇", label: "Beat Marketplace", href: "/marketplace" },
  { icon: "◎", label: "Credit Wallet", href: "/wallet" },
  { icon: "✉", label: "Messages", href: "/messages" },
  { icon: "♙", label: "My Profile", href: "/profile" },
];

const stats = [
  { label: "Available Credits", value: "250", change: "+50 this week" },
  { label: "Active Campaigns", value: "3", change: "2 awaiting reviews" },
  { label: "Total Submissions", value: "24", change: "+8 this month" },
  { label: "Profile Views", value: "1,284", change: "+12.5%" },
];

const submissions = [
  {
    track: "Midnight Drive",
    artist: "Unknown Artist",
    type: "Playlist Submission",
    status: "In Review",
  },
  {
    track: "After Hours",
    artist: "Nova",
    type: "Music Feedback",
    status: "Completed",
  },
  {
    track: "Lost Signals",
    artist: "Echo",
    type: "Playlist Submission",
    status: "Pending",
  },
];

const trending = [
  { title: "No Signal", artist: "Kairo", genre: "Dark Trap" },
  { title: "Blue Hour", artist: "Luna", genre: "Alternative R&B" },
  { title: "Pressure", artist: "Vex", genre: "Drill" },
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

        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-6 lg:px-10">

          <div>
            <p className="text-sm text-gray-400">Creator Dashboard</p>
            <h1 className="text-2xl font-bold">Overview</h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-gray-400 sm:block">
              Welcome back, Creator
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 font-bold">
              N
            </div>
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

          {/* Stats */}
          <section className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-[#11111d] p-6"
              >
                <p className="text-sm text-gray-400">{stat.label}</p>

                <h3 className="mt-3 text-3xl font-bold">{stat.value}</h3>

                <p className="mt-3 text-xs text-violet-400">
                  {stat.change}
                </p>
              </div>
            ))}
          </section>

          <div className="grid gap-8 xl:grid-cols-3">

            {/* Submissions */}
            <section className="xl:col-span-2">

              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold">Recent Submissions</h2>
                <Link href="/campaigns" className="text-sm text-violet-400">
                  View All →
                </Link>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#11111d]">

                {submissions.map((submission, index) => (
                  <div
                    key={submission.track}
                    className={`flex items-center justify-between gap-4 p-5 ${
                      index !== submissions.length - 1
                        ? "border-b border-white/10"
                        : ""
                    }`}
                  >
                    <div>
                      <h3 className="font-semibold">{submission.track}</h3>
                      <p className="mt-1 text-sm text-gray-400">
                        {submission.artist} · {submission.type}
                      </p>
                    </div>

                    <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
                      {submission.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Trending */}
            <section>
              <h2 className="mb-5 text-xl font-bold">Trending on Nexus</h2>

              <div className="rounded-2xl border border-white/10 bg-[#11111d] p-5">

                {trending.map((track, index) => (
                  <div
                    key={track.title}
                    className="flex items-center gap-4 py-4"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
                      ♫
                    </div>

                    <div className="flex-1">
                      <h3 className="text-sm font-semibold">{track.title}</h3>
                      <p className="text-xs text-gray-400">
                        {track.artist} · {track.genre}
                      </p>
                    </div>

                    <span className="text-sm text-gray-500">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}