const features = [
  {
    icon: "♫",
    title: "For Artists",
    description:
      "Submit your music, discover curators, and connect with producers who understand your sound.",
  },
  {
    icon: "◈",
    title: "For Producers",
    description:
      "Showcase your beats, connect with independent artists, and build your production business.",
  },
  {
    icon: "◎",
    title: "For Curators",
    description:
      "Discover emerging talent, review submissions, and build your reputation as a music curator.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080810] text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between border-b border-white/10 px-8 py-6">
        <div className="text-2xl font-black tracking-widest">
          NEXUS<span className="text-violet-500">.</span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="#features"
            className="hidden text-sm text-gray-400 hover:text-white sm:block"
          >
            Explore
          </a>

          <a
            href="#features"
            className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold transition hover:bg-violet-500"
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-28 text-center">
        <div className="mb-8 inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-5 py-2 text-sm text-violet-300">
          The Independent Music Network
        </div>

        <h1 className="mx-auto max-w-4xl text-5xl font-black tracking-tight sm:text-7xl">
          Your music.
          <br />
          Your network.
          <br />
          <span className="text-violet-500">Your next move.</span>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-gray-400">
          The platform connecting independent artists, producers, and
          curators. Discover new sounds, build meaningful connections,
          and grow your music career.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="#features"
            className="rounded-xl bg-violet-600 px-8 py-4 font-semibold transition hover:bg-violet-500"
          >
            Explore Nexus →
          </a>

          <a
            href="#about"
            className="rounded-xl border border-white/20 px-8 py-4 font-semibold transition hover:bg-white/10"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="mx-auto max-w-6xl px-6 pb-28"
      >
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Built for creators.
          </h2>
          <p className="mt-4 text-gray-400">
            One platform. Three communities. Endless possibilities.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition hover:border-violet-500/50"
            >
              <div className="mb-6 text-4xl text-violet-400">
                {feature.icon}
              </div>

              <h3 className="mb-4 text-xl font-bold">
                {feature.title}
              </h3>

              <p className="leading-relaxed text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="border-t border-white/10 bg-white/[0.02] px-6 py-20 text-center"
      >
        <h2 className="text-3xl font-bold">
          The future of independent music starts here.
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-gray-400">
          Nexus brings music discovery, collaboration, and creator
          opportunities together in one connected ecosystem.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 py-8 text-center text-sm text-gray-500">
        © 2026 Nexus Music. Built for independent creators.
      </footer>
    </main>
  );
}