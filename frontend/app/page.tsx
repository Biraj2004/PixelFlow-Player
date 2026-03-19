import Link from 'next/link';

const Home = () => {
  return (
    <main className="min-h-screen px-6 py-16 md:px-10 lg:px-16">
      <section className="mx-auto max-w-5xl rounded-xl border border-white/10 bg-surface-low p-8 md:p-12">
        <div className="space-y-6">
          <p className="font-display text-xs tracking-[0.3em] text-primary uppercase">PixelFlow Platform</p>
          <h1 className="font-display text-4xl md:text-6xl leading-tight text-foreground">
            Play anything.
            <br />
            Stream everything.
          </h1>
          <p className="max-w-2xl text-base text-gray-300">
            Adaptive playback with native, HLS, and DASH fallback, self-healing retries, and inline diagnostics.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/player"
              className="rounded bg-gradient-to-br from-primary to-primary-container px-6 py-3 font-display text-sm font-bold tracking-wide text-black"
            >
              Open Player
            </Link>
            <a
              href="https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd"
              target="_blank"
              rel="noreferrer"
              className="rounded border border-white/20 px-6 py-3 font-display text-sm font-semibold tracking-wide text-gray-200"
            >
              Sample Stream URL
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
