import Link from "next/link";
import { Sparkles, ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32 text-center sm:px-6 lg:px-8">
      <div
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl"
        style={{
          background: "rgba(0,229,255,0.06)",
          border: "1px solid rgba(0,229,255,0.15)",
        }}
      >
        <Compass size={40} className="text-neon-cyan" />
      </div>

      <h1
        className="text-6xl font-bold"
        style={{
          background: "linear-gradient(135deg, #00E5FF, #A855F7)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        404
      </h1>

      <h2 className="mt-4 text-xl font-semibold text-white">Page Not Found</h2>
      <p className="mt-2 max-w-md text-sm text-white/40">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Let&apos;s get you back on track.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm text-white/60 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all"
        >
          <ArrowLeft size={16} />
          Back Home
        </Link>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-neon-cyan/20 transition-all"
        >
          <Sparkles size={16} />
          Explore NFTs
        </Link>
      </div>
    </div>
  );
}
