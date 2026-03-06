"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, TrendingUp, Users, Layers } from "lucide-react";
import { TiltCard3D } from "@/components/shared/TiltCard3D";
import { PromptScoreBadge } from "@/components/shared/PromptScoreBadge";
import { AIModelBadge } from "@/components/shared/AIModelBadge";
import type { NFTItem } from "@/lib/types";
import { formatNumber, formatStx } from "@/lib/utils";

interface ExploreHeroProps {
  featuredNFTs: NFTItem[];
  stats: { totalNfts: number; totalVolume: number; activeCreators: number };
}

export function ExploreHero({ featuredNFTs, stats }: ExploreHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (featuredNFTs.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featuredNFTs.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredNFTs.length]);

  const currentNFT = featuredNFTs[activeIndex];
  if (!currentNFT) return null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/[0.06]">
      {/* Background gradient */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: "linear-gradient(135deg, rgba(0,229,255,0.06) 0%, rgba(168,85,247,0.08) 50%, rgba(236,72,153,0.06) 100%)",
        }}
      />

      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center lg:p-8">
        {/* Left: Info */}
        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted font-semibold mb-2">
              Featured Marketplace
            </p>
            <h1 className="font-heading text-3xl font-bold text-text-primary lg:text-4xl">
              <span
                style={{
                  background: "linear-gradient(135deg, #00E5FF, #A855F7, #EC4899)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Explore NFTs
              </span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary max-w-md">
              Discover AI-generated NFTs scored by prompt quality.
              The best prompts create the most valuable art.
            </p>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
              <Layers size={14} className="text-neon-cyan" />
              <div>
                <p className="text-[10px] text-text-muted uppercase">Total NFTs</p>
                <p className="text-xs font-bold text-text-primary font-mono">{formatNumber(stats.totalNfts)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
              <TrendingUp size={14} className="text-neon-purple" />
              <div>
                <p className="text-[10px] text-text-muted uppercase">Volume</p>
                <p className="text-xs font-bold text-text-primary font-mono">{formatStx(stats.totalVolume * 1_000_000, 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
              <Users size={14} className="text-neon-pink" />
              <div>
                <p className="text-[10px] text-text-muted uppercase">Creators</p>
                <p className="text-xs font-bold text-text-primary font-mono">{formatNumber(stats.activeCreators)}</p>
              </div>
            </div>
          </div>

          {/* Carousel dots */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveIndex((prev) => (prev - 1 + featuredNFTs.length) % featuredNFTs.length)}
              className="rounded-full border border-white/10 bg-bg-card p-1.5 text-text-muted hover:text-neon-cyan hover:border-neon-cyan/30 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex gap-1.5">
              {featuredNFTs.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeIndex
                      ? "w-6 bg-neon-cyan"
                      : "w-1.5 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setActiveIndex((prev) => (prev + 1) % featuredNFTs.length)}
              className="rounded-full border border-white/10 bg-bg-card p-1.5 text-text-muted hover:text-neon-cyan hover:border-neon-cyan/30 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Right: Featured Card */}
        <TiltCard3D tiltAmount={10} scale={1.01}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentNFT.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
              className="relative rounded-xl overflow-hidden border border-white/10"
              style={{
                background: "linear-gradient(180deg, rgba(15,15,36,0.95), rgba(10,10,26,0.98))",
                boxShadow: "0 0 60px rgba(0,229,255,0.1), 0 20px 60px rgba(0,0,0,0.4)",
              }}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
                  <Sparkles size={12} className="text-neon-pink" />
                  Featured
                </span>
                <AIModelBadge model={currentNFT.aiModel} />
              </div>

              {/* Image */}
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentNFT.imageUrl}
                  alt={currentNFT.name}
                  className="h-56 w-full object-cover lg:h-64"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-transparent" />

                {/* Score badge */}
                {currentNFT.promptScore != null && (
                  <div className="absolute right-3 top-3">
                    <PromptScoreBadge score={currentNFT.promptScore} size="md" showLabel />
                  </div>
                )}

                {/* Info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-semibold">
                        {currentNFT.collection || "NeuralMint"}
                      </p>
                      <p className="text-lg font-bold text-text-primary mt-0.5">
                        {currentNFT.name}
                      </p>
                    </div>
                    <div
                      className="rounded-xl px-3 py-2 text-right"
                      style={{
                        background: "rgba(5,5,16,0.85)",
                        border: "1px solid rgba(0,229,255,0.15)",
                        backdropFilter: "blur(12px)",
                      }}
                    >
                      <p className="text-[9px] text-text-muted uppercase tracking-wider font-semibold">Price</p>
                      <p className="font-mono text-base font-bold text-neon-orange mt-0.5">
                        {currentNFT.priceStx.toFixed(2)} STX
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </TiltCard3D>
      </div>
    </section>
  );
}
