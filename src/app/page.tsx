"use client";

import { useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Bitcoin, Sparkles, Zap, ShieldCheck, Eye, Heart, ExternalLink } from "lucide-react";
import Link from "next/link";
import { mockNFTs, mockCollections, mockCreators, platformStats } from "@/lib/mock-data";
import { formatNumber, formatPercentChange, formatStx } from "@/lib/utils";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.2, 0, 0, 1] as [number, number, number, number] },
});

export default function Home() {
  const trending = mockNFTs.slice(0, 6);
  const recent = mockNFTs.slice(2, 8);
  const topCollections = mockCollections.slice(0, 5);
  const topCreators = mockCreators.slice(0, 4);

  return (
    <div className="relative">
      {/* ═══ DEEP SPACE BACKGROUND ═══ */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#030308]" />
        <div className="absolute inset-0 grid-pattern opacity-20" />

        {/* Orbs */}
        <div className="orb orb-cyan" style={{ width: 500, height: 500, top: -100, left: -150 }} />
        <div className="orb orb-purple" style={{ width: 400, height: 400, top: 200, right: -100, animationDelay: "-5s" }} />
        <div className="orb orb-pink" style={{ width: 350, height: 350, bottom: 100, left: "30%", animationDelay: "-10s" }} />
        <div className="orb orb-orange" style={{ width: 300, height: 300, top: "50%", right: "20%", animationDelay: "-7s" }} />

        {/* Floating 3D shapes */}
        <div className="floating-cube absolute top-[15%] left-[8%] opacity-40" />
        <div className="floating-ring absolute top-[30%] right-[12%] opacity-30" />
        <div className="floating-cube absolute bottom-[25%] left-[15%] opacity-25" style={{ width: 24, height: 24, animationDelay: "-3s" }} />
        <div className="floating-triangle absolute top-[60%] right-[8%] opacity-30" />
        <div className="floating-dot absolute top-[20%] right-[30%]" />
        <div className="floating-dot absolute top-[70%] left-[25%]" style={{ animationDelay: "-1.5s" }} />
        <div className="floating-ring absolute bottom-[10%] right-[25%] opacity-20" style={{ width: 30, height: 30, animationDelay: "-4s" }} />
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-20 px-4 pb-24 pt-12 sm:px-6 lg:px-8 lg:pt-20">
        {/* ═══════════════════════════════════
            HERO SECTION — 3D Featured Card
        ═══════════════════════════════════ */}
        <section className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center">
          <div className="space-y-8">
            {/* Live badge */}
            <motion.div {...fadeUp(0)}>
              <span
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold tracking-wider backdrop-blur-sm"
                style={{
                  background: "rgba(0,229,255,0.06)",
                  border: "1px solid rgba(0,229,255,0.2)",
                  color: "#00E5FF",
                }}
              >
                <span
                  className="inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ background: "#22C55E", boxShadow: "0 0 8px rgba(34,197,94,0.6)" }}
                />
                LIVE ON STACKS — SECURED BY BITCOIN
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeUp(0.08)}
              className="font-display text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl"
            >
              <span
                className="block"
                style={{
                  background: "linear-gradient(135deg, #00E5FF 0%, #A855F7 40%, #EC4899 80%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 40px rgba(0,229,255,0.25))",
                }}
              >
                Create. Mint.
              </span>
              <span
                className="block"
                style={{
                  background: "linear-gradient(135deg, #A855F7 0%, #EC4899 40%, #F97316 80%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Trade.
              </span>
              <span className="mt-3 block text-xl sm:text-2xl font-normal text-text-secondary leading-relaxed">
                AI-powered NFTs, secured by Bitcoin.
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              {...fadeUp(0.14)}
              className="max-w-lg text-sm leading-relaxed text-text-secondary"
            >
              Create stunning NFTs with DALL·E 3 and Stable Diffusion — no code needed.
              Mint on Stacks L2, trade with only <span className="text-neon-cyan font-semibold">1% fee</span>, anchored to Bitcoin&apos;s security.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div {...fadeUp(0.2)} className="flex flex-wrap items-center gap-4">
              <Link href="/create" className="btn-primary gap-2 text-sm">
                <Sparkles size={16} />
                Start AI Studio
                <ArrowRight size={16} />
              </Link>
              <Link href="/explore" className="btn-secondary gap-2 text-sm">
                <Eye size={16} />
                Explore Market
              </Link>
            </motion.div>

            {/* Live Stats */}
            <motion.div
              {...fadeUp(0.26)}
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              <StatPill label="NFTs Minted" value={formatNumber(platformStats.totalNftsMinted)} glow="cyan" />
              <StatPill label="Total Volume" value={formatStx(platformStats.totalVolumeStx * 1_000_000, 0)} glow="purple" />
              <StatPill label="Active Creators" value={formatNumber(platformStats.activeCreators)} glow="pink" />
              <StatPill label="Floor Price" value={`${platformStats.floorPriceStx.toFixed(2)} STX`} glow="orange" />
            </motion.div>
          </div>

          {/* ═══ FEATURED NFT — 3D TILT CARD ═══ */}
          <motion.div
            initial={{ opacity: 0, x: 60, rotateY: -15 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.2, 0, 0, 1] }}
            className="relative perspective-container"
          >
            <TiltCard3D>
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: "linear-gradient(180deg, rgba(15,15,36,0.95), rgba(10,10,26,0.98))",
                  border: "1px solid rgba(0,229,255,0.15)",
                  boxShadow: "0 0 60px rgba(0,229,255,0.15), 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                {/* Top bar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
                    <Sparkles size={13} className="text-neon-pink" />
                    Featured AI NFT
                  </span>
                  <span
                    className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold"
                    style={{
                      background: "rgba(168,85,247,0.15)",
                      color: "#A855F7",
                      border: "1px solid rgba(168,85,247,0.2)",
                    }}
                  >
                    DALL·E 3 · STX
                  </span>
                </div>

                {/* Image */}
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={trending[0].imageUrl}
                    alt={trending[0].name}
                    className="h-72 w-full object-cover"
                  />
                  {/* Holographic shine */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(135deg, transparent 30%, rgba(0,229,255,0.08) 45%, rgba(168,85,247,0.1) 50%, rgba(236,72,153,0.08) 55%, transparent 70%)",
                      backgroundSize: "300% 300%",
                      animation: "holographic 5s ease infinite",
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-transparent" />

                  {/* Bottom info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-semibold">
                          {trending[0].collection}
                        </p>
                        <p className="text-lg font-bold text-text-primary mt-0.5">
                          {trending[0].name}
                        </p>
                      </div>
                      <div
                        className="rounded-xl px-4 py-2.5 text-right"
                        style={{
                          background: "rgba(5,5,16,0.85)",
                          border: "1px solid rgba(0,229,255,0.15)",
                          backdropFilter: "blur(12px)",
                        }}
                      >
                        <p className="text-[9px] text-text-muted uppercase tracking-wider font-semibold">Current Price</p>
                        <p className="font-mono text-base font-bold text-neon-orange mt-0.5">
                          {trending[0].priceStx.toFixed(2)} STX
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom action bar */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-text-muted hover:text-neon-pink transition-colors text-xs">
                      <Heart size={14} /> 248
                    </button>
                    <button className="flex items-center gap-1.5 text-text-muted hover:text-neon-cyan transition-colors text-xs">
                      <Eye size={14} /> 1.2K
                    </button>
                  </div>
                  <Link
                    href="/explore"
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-neon-cyan hover:text-white transition-colors"
                  >
                    View Details <ExternalLink size={11} />
                  </Link>
                </div>
              </div>
            </TiltCard3D>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════
            TRENDING NFTs — 3D Cards
        ═══════════════════════════════════ */}
        <section className="space-y-6">
          <SectionHeader title="Trending NFTs">
            <div className="flex items-center gap-1.5 text-[11px]">
              {["24h", "7d", "All"].map((tab, i) => (
                <button
                  key={tab}
                  className={`rounded-full px-3.5 py-1 font-semibold transition-all ${
                    i === 0
                      ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20"
                      : "text-text-muted hover:text-text-secondary hover:bg-white/[0.04]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </SectionHeader>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((nft, i) => (
              <motion.div key={nft.id} {...fadeUp(i * 0.06)}>
                <NFTCard3D nft={nft} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════
            COLLECTIONS + BITCOIN SECURITY
        ═══════════════════════════════════ */}
        <section className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="space-y-5">
            <SectionHeader title="Top Collections">
              <Link href="/collections" className="text-xs font-semibold text-neon-cyan hover:text-neon-purple transition-colors">
                View all →
              </Link>
            </SectionHeader>
            <div className="space-y-3">
              {topCollections.map((col, i) => (
                <motion.div key={col.id} {...fadeUp(i * 0.05)}>
                  <div className="neon-card holo-shine flex items-center gap-3.5 p-3.5 group cursor-pointer">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={col.avatarUrl} alt={col.name} className="h-11 w-11 rounded-xl object-cover ring-1 ring-white/10" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-neon-green border-2 border-bg-card" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate group-hover:text-neon-cyan transition-colors">
                        {col.name}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Floor: <span className="font-mono text-neon-orange">{col.floorPriceStx.toFixed(2)} STX</span>
                        {" · "}Volume: <span className="font-mono">{formatStx(col.volumeStx * 1_000_000, 0)}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-[11px] font-bold ${col.change24h >= 0 ? "text-neon-green" : "text-neon-red"}`}>
                        {formatPercentChange(col.change24h)}
                      </p>
                      <p className="text-[10px] text-text-muted">{formatNumber(col.itemCount)} NFT</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bitcoin Security Card */}
          <div className="space-y-5">
            <SectionHeader title="Secured by Bitcoin" />
            <motion.div {...fadeUp(0.1)}>
              <div
                className="neon-card relative overflow-hidden p-5"
                style={{
                  background: "linear-gradient(180deg, rgba(15,15,36,0.95), rgba(10,10,26,0.98))",
                  borderColor: "rgba(249,115,22,0.15)",
                }}
              >
                {/* Background decoration */}
                <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full opacity-60" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)" }} />
                <div className="absolute -left-8 bottom-0 w-32 h-32 rounded-full opacity-40" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)" }} />

                <div className="relative flex flex-col gap-5">
                  <div className="inline-flex items-center gap-2.5 rounded-full bg-neon-orange/10 border border-neon-orange/20 px-3.5 py-1.5 text-[11px] font-semibold text-neon-orange self-start">
                    <Bitcoin size={14} />
                    Stacks → Bitcoin PoX
                  </div>

                  <p className="text-sm text-text-secondary leading-relaxed">
                    Every NFT mint and trade is anchored to Bitcoin&apos;s Proof of Work security through Stacks.
                    Clarity smart contracts show exactly what will happen with your funds <strong className="text-text-primary">before you sign</strong>.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center shrink-0">
                        <ShieldCheck size={16} className="text-neon-green" />
                      </div>
                      <span className="text-[11px] text-text-secondary leading-tight">Auditable Clarity contracts</span>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 flex items-center justify-center shrink-0">
                        <Zap size={16} className="text-neon-cyan" />
                      </div>
                      <span className="text-[11px] text-text-secondary leading-tight">Fast microblock confirmations</span>
                    </div>
                  </div>

                  {/* 3D connection visual */}
                  <div className="flex items-center justify-center gap-4 py-3">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
                        <span className="text-[10px] font-black text-neon-cyan">STX</span>
                      </div>
                      <span className="text-[9px] text-text-muted">Stacks L2</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-neon-cyan/40" style={{ animationDelay: `${i * 0.2}s`, animation: "glow-pulse 1.5s ease-in-out infinite" }} />
                      ))}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-xl bg-neon-orange/10 border border-neon-orange/20 flex items-center justify-center">
                        <Bitcoin size={16} className="text-neon-orange" />
                      </div>
                      <span className="text-[9px] text-text-muted">Bitcoin L1</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════
            HOW IT WORKS + RECENTLY LISTED + CREATORS
        ═══════════════════════════════════ */}
        <section className="grid gap-10 lg:grid-cols-3">
          {/* AI Studio Steps */}
          <div className="space-y-5">
            <SectionHeader title="How AI Studio Works" />
            <div className="space-y-3">
              <StepCard index={1} title="Define your vision" color="cyan">
                Cyberpunk, abstract or portrait — write your prompt or enhance it with GPT.
              </StepCard>
              <StepCard index={2} title="AI generates art" color="purple">
                Get high-res images with DALL·E 3 or Stable Diffusion in one click.
              </StepCard>
              <StepCard index={3} title="Mint & list on Stacks" color="pink">
                Mint your SIP-009 compliant NFT, then list it on the marketplace for STX.
              </StepCard>
            </div>
            <Link href="/create" className="inline-flex items-center gap-1.5 text-xs font-semibold text-neon-cyan hover:text-neon-purple transition-colors mt-2">
              Try demo prompt <ArrowRight size={13} />
            </Link>
          </div>

          {/* Recently Listed */}
          <div className="space-y-5">
            <SectionHeader title="Recently Listed" />
            <div className="space-y-2.5">
              {recent.map((nft) => (
                <div key={nft.id} className="neon-card flex items-center gap-3 p-3 group cursor-pointer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={nft.imageUrl} alt={nft.name} className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/10 group-hover:ring-neon-cyan/30 transition-all" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-semibold text-text-primary group-hover:text-neon-cyan transition-colors">{nft.name}</p>
                    <p className="truncate text-[11px] text-text-muted">{nft.creator.bnsName} · {nft.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-xs font-semibold text-neon-orange">{nft.priceStx.toFixed(2)} STX</p>
                    {nft.isAuction && nft.currentBidStx && (
                      <p className="text-[10px] text-text-muted">Bid {nft.currentBidStx.toFixed(2)} STX</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Creators */}
          <div className="space-y-5">
            <SectionHeader title="Top Creators" />
            <div className="space-y-2.5">
              {topCreators.map((creator, i) => (
                <div key={creator.address} className="neon-card flex items-center gap-3 p-3 group cursor-pointer">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={creator.avatarUrl} alt={creator.bnsName} className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10" />
                    <div
                      className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black"
                      style={{
                        background: i === 0 ? "linear-gradient(135deg, #FACC15, #F97316)" : i === 1 ? "linear-gradient(135deg, #94A3B8, #CBD5E1)" : "linear-gradient(135deg, #B45309, #D97706)",
                        color: i <= 1 ? "#000" : "#FFF",
                        border: "2px solid #050510",
                      }}
                    >
                      {i + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary group-hover:text-neon-cyan transition-colors truncate">{creator.bnsName}</p>
                    <p className="text-[11px] text-text-muted">
                      {formatNumber(creator.followers)} followers · {creator.isVerified ? "✓ Verified" : "Creator"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-text-muted">Total Sales</p>
                    <p className="font-mono text-xs font-bold text-neon-green">{formatStx(creator.totalSalesStx * 1_000_000, 0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   3D TILT CARD COMPONENT
   ════════════════════════════════════════════════ */
function TiltCard3D({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const tiltX = (0.5 - y) * 12;
    const tiltY = (x - 0.5) * 12;
    ref.current.style.transform = `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02,1.02,1.02)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: "transform 0.4s cubic-bezier(0.2, 0, 0, 1)", transformStyle: "preserve-3d", willChange: "transform" }}
    >
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════
   3D NFT CARD
   ════════════════════════════════════════════════ */
function NFTCard3D({ nft }: { nft: (typeof mockNFTs)[0] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const tiltX = (0.5 - y) * 8;
    const tiltY = (x - 0.5) * 8;
    ref.current.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(10px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
    setHovered(false);
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="neon-card holo-shine overflow-hidden cursor-pointer group"
      style={{
        transition: "transform 0.35s cubic-bezier(0.2, 0, 0, 1), border-color 0.35s, box-shadow 0.35s",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={nft.imageUrl}
          alt={nft.name}
          className="h-52 w-full object-cover transition-transform duration-500"
          style={{ transform: hovered ? "scale(1.05)" : "scale(1)" }}
        />
        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 rounded-full bg-black/70 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold text-neon-cyan border border-neon-cyan/20">
          {nft.aiModel === "dall-e-3" ? "DALL·E 3" : "Stable Diffusion"}
        </div>
        {nft.isAuction && nft.blocksRemaining && (
          <div className="absolute right-2.5 top-2.5 rounded-full bg-black/70 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-mono text-neon-pink border border-neon-pink/20">
            ~{nft.blocksRemaining} blocks
          </div>
        )}
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-transparent" />
      </div>

      <div className="p-4 space-y-2.5 relative" style={{ transform: "translateZ(20px)" }}>
        <p className="truncate text-[11px] text-text-muted font-medium">{nft.collection}</p>
        <p className="truncate text-sm font-bold text-text-primary group-hover:text-neon-cyan transition-colors">
          {nft.name}
        </p>
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-[10px] text-text-muted block">Price</span>
            <span className="font-mono text-sm font-bold text-neon-orange">{nft.priceStx.toFixed(2)} STX</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-text-muted block">Rarity</span>
            <span className="text-xs font-bold text-neon-purple">{nft.rarity}/100</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   UTILITY COMPONENTS
   ════════════════════════════════════════════════ */
function StatPill({ label, value, glow }: { label: string; value: string; glow: string }) {
  const colors: Record<string, string> = {
    cyan: "rgba(0,229,255,0.08)",
    purple: "rgba(168,85,247,0.08)",
    pink: "rgba(236,72,153,0.08)",
    orange: "rgba(249,115,22,0.08)",
  };
  const borders: Record<string, string> = {
    cyan: "rgba(0,229,255,0.15)",
    purple: "rgba(168,85,247,0.15)",
    pink: "rgba(236,72,153,0.15)",
    orange: "rgba(249,115,22,0.15)",
  };
  return (
    <div
      className="flex flex-col rounded-xl px-3.5 py-2.5 backdrop-blur-sm"
      style={{ background: colors[glow], border: `1px solid ${borders[glow]}` }}
    >
      <span className="text-[10px] text-text-muted font-semibold tracking-wide uppercase">{label}</span>
      <span className="mt-1 text-sm font-bold text-text-primary font-mono">{value}</span>
    </div>
  );
}

function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 rounded-full" style={{ background: "linear-gradient(180deg, #00E5FF, #A855F7)" }} />
        <h2 className="font-heading text-lg font-bold text-text-primary tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StepCard({ index, title, color, children }: { index: number; title: string; color: string; children: React.ReactNode }) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    cyan: { bg: "rgba(0,229,255,0.1)", border: "rgba(0,229,255,0.2)", text: "#00E5FF" },
    purple: { bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.2)", text: "#A855F7" },
    pink: { bg: "rgba(236,72,153,0.1)", border: "rgba(236,72,153,0.2)", text: "#EC4899" },
  };
  const c = colors[color] || colors.cyan;
  return (
    <div className="neon-card flex gap-3.5 p-3.5">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-black shrink-0"
        style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
      >
        {index}
      </div>
      <div className="space-y-0.5">
        <p className="text-xs font-bold text-text-primary">{title}</p>
        <p className="text-[11px] text-text-secondary leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
