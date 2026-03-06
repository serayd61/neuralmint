"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("NeuralMint error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32 text-center sm:px-6 lg:px-8">
      <div
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl"
        style={{
          background: "rgba(255,51,51,0.06)",
          border: "1px solid rgba(255,51,51,0.15)",
        }}
      >
        <AlertTriangle size={40} className="text-neon-red" />
      </div>

      <h2 className="text-xl font-semibold text-white">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-white/40">
        An unexpected error occurred. Please try again or navigate back.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-neon-cyan/20 transition-all"
        >
          <RotateCcw size={16} />
          Try Again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm text-white/60 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all"
        >
          <ArrowLeft size={16} />
          Back Home
        </Link>
      </div>
    </div>
  );
}
