"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Bitcoin, Sparkles, Zap, ShieldCheck, Eye, Heart,
  ExternalLink, TrendingUp, TrendingDown, CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { formatNumber, formatPercentChange, formatStx } from "@/lib/utils";
import { NFT_CONTRACT_ADDRESS, NFT_CONTRACT_NAME, STACKS_API_URL } from "@/lib/constants";
import { PromptScoreBadge } from "@/components/shared/PromptScoreBadge";
import { getGatewayUrls } from "@/lib/ipfs";

/* ════════════════════════════════════════════════
   ANIMATION VARIANTS
   ════════════════════════════════════════════════ */
const staggerContainer = (stagger = 0.15) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: 0.05 } },
});

const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] as const } },
};

const slideLeftVariant = {
  hidden: { opacity: 0, x: -40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] as const } },
};

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ════════════════════════════════════════════════════════════════ */
interface ChainNFT {
  id: string;
  tokenId: number;
  name: string;
  imageUrl: string;
  collection: string;
  aiModel: string;
  priceStx: number;
  promptScore?: number;
  creator: { address: string; bnsName: string; avatarUrl: string };
  category: string;
  rarity: number;
  isAuction: boolean;
}

export default function Home() {
  const [trending, setTrending] = useState<ChainNFT[]>([]);
  const [recent, setRecent] = useState<ChainNFT[]>([]);
  const [topCollections, setTopCollections] = useState<Array<{
    id: string; name: string; avatarUrl: string; floorPriceStx: number;
    volumeStx: number; change24h: number; itemCount: number;
  }>>([]);
  const [topCreators, setTopCreators] = useState<Array<{
    address: string; bnsName: string; avatarUrl: string;
    totalSalesStx: number; nftCount: number; followers: number; isVerified: boolean;
  }>>([]);

  const [platformStats, setPlatformStats] = useState({
    totalNftsMinted: 0,
    totalVolumeStx: 0,
    activeCreators: 0,
    floorPriceStx: 0,
    stxPriceUsd: 0,
  });

  // Fetch platform stats
  useEffect(() => {
    fetch("/api/v1/stats")
      .then((res) => res.json())
      .then((data) => setPlatformStats(data))
      .catch(console.error);
  }, []);

  // Fetch real NFTs from chain for trending & recent, derive collections & creators
  useEffect(() => {
    (async () => {
      try {
        const collectionsRes = await fetch("/api/collections");
        if (!collectionsRes.ok) return;
        const colData = await collectionsRes.json();
        const totalMinted = colData.collections?.[0]?.totalMinted || 0;

        // Set NeuralMint as top collection with real data
        if (totalMinted > 0) {
          setTopCollections([{
            id: "neuralmint",
            name: "NeuralMint",
            avatarUrl: "",
            floorPriceStx: colData.collections?.[0]?.floorPrice || 0,
            volumeStx: 0,
            change24h: 0,
            itemCount: totalMinted,
          }]);
        }

        if (totalMinted === 0) return;

        const fetchedNfts: ChainNFT[] = [];
        const creatorMap = new Map<string, { count: number; bnsName: string }>();
        const startId = Math.max(1, totalMinted - 11);

        for (let id = totalMinted; id >= startId; id--) {
          try {
            const hexTokenId = "01" + id.toString(16).padStart(32, "0");
            const res = await fetch(
              `${STACKS_API_URL}/v2/contracts/call-read/${NFT_CONTRACT_ADDRESS}/${NFT_CONTRACT_NAME}/get-token-uri`,
              { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sender: NFT_CONTRACT_ADDRESS, arguments: [`0x${hexTokenId}`] }) }
            );
            if (!res.ok) continue;
            const data = await res.json();
            const hex = data.result?.slice(2) || "";
            if (!hex.startsWith("070a0d")) continue;
            const length = parseInt(hex.slice(6, 14), 16);
            const strHex = hex.slice(14, 14 + length * 2);
            const bytes = new Uint8Array(strHex.match(/.{2}/g)!.map((b: string) => parseInt(b, 16)));
            const uri = new TextDecoder().decode(bytes);
            const metaUrl = uri.startsWith("ipfs://") ? `https://cloudflare-ipfs.com/ipfs/${uri.slice(7)}` : uri;
            const metaRes = await fetch(metaUrl, { signal: AbortSignal.timeout(10000) });
            if (!metaRes.ok) continue;
            const metadata = await metaRes.json();
            const imageUrl = metadata.image ? (getGatewayUrls(metadata.image)[0] || metadata.image) : "";
            const creatorAddr = NFT_CONTRACT_ADDRESS;
            const existing = creatorMap.get(creatorAddr);
            creatorMap.set(creatorAddr, { count: (existing?.count || 0) + 1, bnsName: existing?.bnsName || "neuralmint" });
            fetchedNfts.push({
              id: String(id),
              tokenId: id,
              name: metadata.name || `NeuralMint #${id}`,
              imageUrl,
              collection: "NeuralMint",
              aiModel: metadata.attributes?.find((a: any) => a.trait_type === "AI Model")?.value?.toLowerCase().includes("dall") ? "dall-e-3" : "stable-diffusion",
              priceStx: 0,
              promptScore: metadata.properties?.prompt_score || undefined,
              creator: { address: creatorAddr, bnsName: "neuralmint", avatarUrl: "" },
              category: "Art",
              rarity: metadata.properties?.prompt_score || 50,
              isAuction: false,
            });
          } catch {}
        }

        if (fetchedNfts.length > 0) {
          setTrending([...fetchedNfts].sort((a, b) => (b.promptScore ?? 0) - (a.promptScore ?? 0)).slice(0, 3));
          setRecent([...fetchedNfts].sort((a, b) => b.tokenId - a.tokenId).slice(0, 6));

          // Build top creators from real data
          const creators = Array.from(creatorMap.entries()).map(([addr, info]) => ({
            address: addr,
            bnsName: info.bnsName,
            avatarUrl: "",
            totalSalesStx: 0,
            nftCount: info.count,
            followers: 0,
            isVerified: true,
          })).sort((a, b) => b.nftCount - a.nftCount).slice(0, 5);
          setTopCreators(creators);
        }
      } catch {}
    })();
  }, []);

  return (
    <div className="relative">
      {/* ═══ NEURAL NETWORK PARTICLE BACKGROUND ═══ */}
      <NeuralNetworkBg />

      {/* ═══ DEEP SPACE BACKGROUND ═══ */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#030308]" />
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="orb orb-cyan" style={{ width: 500, height: 500, top: -100, left: -150 }} />
        <div className="orb orb-purple" style={{ width: 400, height: 400, top: 200, right: -100, animationDelay: "-5s" }} />
        <div className="orb orb-pink" style={{ width: 350, height: 350, bottom: 100, left: "30%", animationDelay: "-10s" }} />
        <div className="orb orb-orange" style={{ width: 300, height: 300, top: "50%", right: "20%", animationDelay: "-7s" }} />
        <div className="floating-cube absolute top-[15%] left-[8%] opacity-40" />
        <div className="floating-ring absolute top-[30%] right-[12%] opacity-30" />
        <div className="floating-cube absolute bottom-[25%] left-[15%] opacity-25" style={{ width: 24, height: 24, animationDelay: "-3s" }} />
        <div className="floating-triangle absolute top-[60%] right-[8%] opacity-30" />
        <div className="floating-dot absolute top-[20%] right-[30%]" />
        <div className="floating-dot absolute top-[70%] left-[25%]" style={{ animationDelay: "-1.5s" }} />
        <div className="floating-ring absolute bottom-[10%] right-[25%] opacity-20" style={{ width: 30, height: 30, animationDelay: "-4s" }} />
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-20 px-4 pb-24 pt-12 sm:px-6 lg:px-8 lg:pt-20">
        {/* ════════════════════════════════════════
            HERO SECTION
        ════════════════════════════════════════ */}
        <section className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center">
          <div className="space-y-8">
            {/* Live badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
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

            {/* Headline with typewriter */}
            <h1 className="font-display text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              <TypewriterHeading />
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.6, ease: [0.2, 0, 0, 1] }}
                className="mt-3 block text-xl sm:text-2xl font-normal text-text-secondary leading-relaxed"
              >
                AI-powered NFTs, secured by Bitcoin.
              </motion.span>
            </h1>

            {/* Description — fade-in + slide-up */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.6, ease: [0.2, 0, 0, 1] }}
              className="max-w-lg text-sm leading-relaxed text-text-secondary"
            >
              Create stunning NFTs with DALL·E 3 and Stable Diffusion — no code needed.
              Mint on Stacks L2, trade with only{" "}
              <span className="text-neon-cyan font-semibold">1% fee</span>, anchored to
              Bitcoin&apos;s security.
            </motion.p>

            {/* CTA Buttons — scale bounce */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.0, duration: 0.5, type: "spring", bounce: 0.4 }}
              className="flex flex-wrap items-center gap-4"
            >
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

            {/* Live Stats — scroll-triggered stagger + countUp */}
            <motion.div
              variants={staggerContainer(0.15)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              <motion.div variants={fadeUpVariant}>
                <StatPill label="NFTs Minted" glow="cyan">
                  <CountUpValue target={platformStats.totalNftsMinted} formatter={(n) => formatNumber(Math.round(n))} />
                </StatPill>
              </motion.div>
              <motion.div variants={fadeUpVariant}>
                <StatPill label="Total Volume" glow="purple">
                  <CountUpValue target={platformStats.totalVolumeStx} formatter={(n) => formatStx(Math.round(n) * 1_000_000, 0)} />
                </StatPill>
              </motion.div>
              <motion.div variants={fadeUpVariant}>
                <StatPill label="Active Creators" glow="pink">
                  <CountUpValue target={platformStats.activeCreators} formatter={(n) => formatNumber(Math.round(n))} />
                </StatPill>
              </motion.div>
              <motion.div variants={fadeUpVariant}>
                <StatPill label="Floor Price" glow="orange">
                  <CountUpValue target={platformStats.floorPriceStx} formatter={(n) => `${n.toFixed(2)} STX`} />
                </StatPill>
              </motion.div>
            </motion.div>
          </div>

          {/* ═══ FEATURED NFT — Floating + Rotating Border + 3D Tilt ═══ */}
          <motion.div
            initial={{ opacity: 0, x: 60, rotateY: -15 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.2, 0, 0, 1] }}
            className="perspective-container"
          >
            <div className="animate-card-float">
              <div className="rotating-border-wrap rounded-2xl">
                <TiltCard3D>
                  <div
                    className="relative rounded-2xl overflow-hidden"
                    style={{
                      background: "linear-gradient(180deg, rgba(15,15,36,0.95), rgba(10,10,26,0.98))",
                    }}
                  >
                    {/* Top bar */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
                        <Sparkles size={13} className="text-neon-pink" />
                        Featured AI NFT
                      </span>
                      <span className="badge-shimmer rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold" style={{ background: "rgba(168,85,247,0.15)", color: "#A855F7", border: "1px solid rgba(168,85,247,0.2)" }}>
                        {trending[0] ? (trending[0].aiModel === "dall-e-3" ? "DALL·E 3" : "SD XL") : "DALL·E 3"} · STX
                      </span>
                    </div>

                    {/* Image — real NFT or placeholder */}
                    <div className="relative">
                      {trending[0]?.imageUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={trending[0].imageUrl} alt={trending[0].name} className="h-72 w-full object-cover" />
                          {trending[0].promptScore != null && trending[0].promptScore > 0 && (
                            <div className="absolute right-3 top-3">
                              <PromptScoreBadge score={trending[0].promptScore} size="sm" />
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="h-72 w-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(0,229,255,0.05), rgba(168,85,247,0.08), rgba(236,72,153,0.05))" }}>
                          <div className="text-center">
                            <Sparkles size={48} className="mx-auto text-neon-cyan/30 mb-3" />
                            <p className="text-sm font-semibold text-white/50">Your NFT could be here</p>
                            <p className="text-xs text-white/25 mt-1">Create the first Legendary NFT</p>
                          </div>
                        </div>
                      )}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-transparent" />
                    </div>

                    {/* Action bar */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                      <div className="flex items-center gap-4">
                        {trending[0] && (
                          <span className="text-xs font-semibold text-text-primary truncate max-w-[180px]">{trending[0].name}</span>
                        )}
                      </div>
                      <Link href={trending[0] ? `/nft/${trending[0].tokenId}` : "/explore"} className="flex items-center gap-1.5 text-[11px] font-semibold text-neon-cyan hover:text-white transition-colors">
                        View Details <ExternalLink size={11} />
                      </Link>
                    </div>
                  </div>
                </TiltCard3D>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ════════════════════════════════════════
            TRENDING NFTs — Staggered slide-in
        ════════════════════════════════════════ */}
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

          <motion.div
            variants={staggerContainer(0.1)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {trending.length > 0 ? trending.map((nft: any) => (
              <motion.div key={nft.id} variants={slideLeftVariant}>
                <NFTCard3D nft={nft} />
              </motion.div>
            )) : (
              <motion.div variants={fadeUpVariant} className="col-span-full flex flex-col items-center py-16 text-center">
                <Sparkles size={32} className="text-neon-cyan/30 mb-3" />
                <p className="text-sm text-white/40">No NFTs minted yet. Be the first creator!</p>
                <Link href="/create" className="mt-4 btn-primary text-sm">Create NFT</Link>
              </motion.div>
            )}
          </motion.div>
        </section>

        {/* ════════════════════════════════════════
            COLLECTIONS + BITCOIN SECURITY
        ════════════════════════════════════════ */}
        <section className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* Top Collections — scroll-triggered stagger */}
          <div className="space-y-5">
            <SectionHeader title="Top Collections">
              <Link href="/collections" className="text-xs font-semibold text-neon-cyan hover:text-neon-purple transition-colors">
                View all →
              </Link>
            </SectionHeader>
            <motion.div
              variants={staggerContainer(0.12)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              className="space-y-3"
            >
              {topCollections.length > 0 ? topCollections.map((col) => (
                <motion.div key={col.id} variants={fadeUpVariant}>
                  <Link href="/collections" className="neon-card holo-shine flex items-center gap-3.5 p-3.5 group cursor-pointer">
                    <div className="relative">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center ring-1 ring-white/10">
                        <Sparkles size={16} className="text-neon-cyan" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-neon-green border-2 border-bg-card" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate group-hover:text-neon-cyan transition-colors">
                        {col.name}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {col.itemCount > 0 && <>{formatNumber(col.itemCount)} NFTs minted</>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-text-muted">{formatNumber(col.itemCount)} NFT</p>
                    </div>
                  </Link>
                </motion.div>
              )) : (
                <motion.div variants={fadeUpVariant} className="flex flex-col items-center py-8 text-center">
                  <Sparkles size={24} className="text-neon-cyan/20 mb-2" />
                  <p className="text-xs text-white/30">Collections coming soon</p>
                  <Link href="/create" className="mt-2 text-[11px] text-neon-cyan hover:text-neon-purple transition-colors">Start creating →</Link>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Bitcoin Security — enhanced flow animation */}
          <div className="space-y-5">
            <SectionHeader title="Secured by Bitcoin" />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
            >
              <div
                className="neon-card relative overflow-hidden p-5"
                style={{
                  background: "linear-gradient(180deg, rgba(15,15,36,0.95), rgba(10,10,26,0.98))",
                  borderColor: "rgba(249,115,22,0.15)",
                }}
              >
                {/* Blockchain grid bg */}
                <div className="absolute inset-0 blockchain-grid opacity-40 pointer-events-none" />

                <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full opacity-60" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)" }} />
                <div className="absolute -left-8 bottom-0 w-32 h-32 rounded-full opacity-40" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)" }} />

                <div className="relative flex flex-col gap-5">
                  <div className="inline-flex items-center gap-2.5 rounded-full bg-neon-orange/10 border border-neon-orange/20 px-3.5 py-1.5 text-[11px] font-semibold text-neon-orange self-start">
                    <Bitcoin size={14} />
                    Stacks → Bitcoin PoX
                  </div>

                  <p className="text-sm text-text-secondary leading-relaxed">
                    Every NFT mint and trade is anchored to Bitcoin&apos;s Proof of Work security through Stacks.
                    Clarity smart contracts show exactly what will happen with your funds{" "}
                    <strong className="text-text-primary">before you sign</strong>.
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

                  {/* Animated flow connection */}
                  <div className="flex items-center justify-center gap-3 py-3">
                    <div className="flex flex-col items-center gap-1 relative">
                      <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center relative z-10">
                        <span className="text-[10px] font-black text-neon-cyan">STX</span>
                      </div>
                      <div className="absolute inset-0 w-10 h-10 rounded-xl bg-neon-cyan/20 ping-slow" />
                      <span className="text-[9px] text-text-muted">Stacks L2</span>
                    </div>

                    {/* Flow dots */}
                    <div className="flex items-center gap-2 relative w-24 justify-center">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flow-dot" style={{ animationDelay: `${i * 0.4}s` }} />
                      ))}
                    </div>

                    <div className="flex flex-col items-center gap-1 relative">
                      <div className="w-10 h-10 rounded-xl bg-neon-orange/10 border border-neon-orange/20 flex items-center justify-center relative z-10">
                        <Bitcoin size={16} className="text-neon-orange" />
                      </div>
                      <div className="absolute inset-0 w-10 h-10 rounded-xl bg-neon-orange/20 ping-slow" style={{ animationDelay: "1s" }} />
                      <span className="text-[9px] text-text-muted">Bitcoin L1</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            HOW IT WORKS + RECENTLY LISTED + CREATORS
        ════════════════════════════════════════ */}
        <section className="grid gap-10 lg:grid-cols-3">
          {/* AI Studio Steps — staggered + connecting lines */}
          <div className="space-y-5">
            <SectionHeader title="How AI Studio Works" />
            <motion.div
              variants={staggerContainer(0.3)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              className="relative space-y-3"
            >
              {/* SVG connecting line */}
              <ConnectingLine />

              <motion.div variants={fadeUpVariant}>
                <StepCard index={1} title="Define your vision" color="cyan">
                  Cyberpunk, abstract or portrait — write your prompt or enhance it with GPT.
                </StepCard>
              </motion.div>
              <motion.div variants={fadeUpVariant}>
                <StepCard index={2} title="AI generates art" color="purple">
                  Get high-res images with DALL·E 3 or Stable Diffusion in one click.
                </StepCard>
              </motion.div>
              <motion.div variants={fadeUpVariant}>
                <StepCard index={3} title="Mint & list on Stacks" color="pink">
                  Mint your SIP-009 compliant NFT, then list it on the marketplace for STX.
                </StepCard>
              </motion.div>
            </motion.div>
            <Link href="/create" className="inline-flex items-center gap-1.5 text-xs font-semibold text-neon-cyan hover:text-neon-purple transition-colors mt-2">
              Try demo prompt <ArrowRight size={13} />
            </Link>
          </div>

          {/* Recently Listed */}
          <div className="space-y-5">
            <SectionHeader title="Recently Minted" />
            {recent.length > 0 ? (
              <div className="overflow-hidden rounded-xl" style={{ height: 340 }}>
                <div className="marquee-vertical flex flex-col gap-2.5" style={{ paddingBottom: 8 }}>
                  {[...recent, ...recent].map((nft, i) => (
                    <Link key={`${nft.id}-${i}`} href={`/nft/${nft.tokenId}`} className="neon-card flex items-center gap-3 p-3 group cursor-pointer shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={nft.imageUrl}
                        alt={nft.name}
                        className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/10 group-hover:ring-neon-cyan/30 transition-all"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-semibold text-text-primary group-hover:text-neon-cyan transition-colors">
                          {nft.name}
                        </p>
                        <p className="truncate text-[11px] text-text-muted">
                          {nft.creator.bnsName} · {nft.category}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-xs font-semibold text-neon-orange">
                          #{nft.tokenId}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] py-16 text-center">
                <Sparkles size={24} className="text-neon-cyan/30 mb-3" />
                <p className="text-sm text-white/40">No NFTs minted yet</p>
                <Link href="/create" className="mt-3 text-xs text-neon-cyan hover:text-neon-purple transition-colors">Create the first NFT →</Link>
              </div>
            )}
          </div>

          {/* Top Creators — medal shimmer + sparkle + countUp */}
          <div className="space-y-5">
            <SectionHeader title="Top Creators" />
            <motion.div
              variants={staggerContainer(0.15)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              className="space-y-2.5"
            >
              {topCreators.length > 0 ? topCreators.map((creator, i) => (
                <motion.div key={creator.address} variants={fadeUpVariant}>
                  <Link href={`/profile/${creator.address}`} className="neon-card flex items-center gap-3 p-3 group cursor-pointer">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-neon-purple/30 to-neon-cyan/30 flex items-center justify-center ring-1 ring-white/10">
                        <span className="text-[11px] font-bold text-white/60">{creator.bnsName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div
                        className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${i < 3 ? "medal-shimmer" : ""}`}
                        style={{
                          background: i === 0
                            ? "linear-gradient(135deg, #FACC15, #F97316)"
                            : i === 1
                            ? "linear-gradient(135deg, #94A3B8, #CBD5E1)"
                            : i === 2
                            ? "linear-gradient(135deg, #B45309, #D97706)"
                            : "linear-gradient(135deg, #475569, #64748B)",
                          color: i <= 1 ? "#000" : "#FFF",
                          border: "2px solid #050510",
                        }}
                      >
                        {i + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text-primary group-hover:text-neon-cyan transition-colors truncate">
                        {creator.bnsName}
                      </p>
                      <p className="text-[11px] text-text-muted flex items-center gap-1">
                        {creator.nftCount} NFTs
                        {creator.isVerified && (
                          <CheckCircle size={11} className="text-neon-cyan" />
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-text-muted">NFTs Created</p>
                      <p className="font-mono text-xs font-bold text-neon-green">{creator.nftCount}</p>
                    </div>
                  </Link>
                </motion.div>
              )) : (
                <motion.div variants={fadeUpVariant} className="flex flex-col items-center py-8 text-center">
                  <Sparkles size={24} className="text-neon-purple/20 mb-2" />
                  <p className="text-xs text-white/30">No creators yet</p>
                  <Link href="/create" className="mt-2 text-[11px] text-neon-cyan hover:text-neon-purple transition-colors">Be the first →</Link>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   NEURAL NETWORK PARTICLE BACKGROUND (Canvas)
   ════════════════════════════════════════════════ */
function NeuralNetworkBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Skip on reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 30 : 65;
    const maxDist = isMobile ? 100 : 150;
    let raf: number;

    const colors: number[][] = [
      [168, 85, 247],  // purple
      [59, 130, 246],  // blue
      [249, 115, 22],  // orange
      [0, 229, 255],   // cyan
    ];

    type P = { x: number; y: number; vx: number; vy: number; c: number[]; r: number };
    let particles: P[] = [];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function init() {
      resize();
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        c: colors[Math.floor(Math.random() * colors.length)],
        r: Math.random() * 1.5 + 0.5,
      }));
    }

    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},0.5)`;
        ctx!.fill();
      }

      // Connections
      const md2 = maxDist * maxDist;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < md2) {
            const alpha = (1 - Math.sqrt(d2) / maxDist) * 0.12;
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(${particles[i].c[0]},${particles[i].c[1]},${particles[i].c[2]},${alpha})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="neural-canvas pointer-events-none fixed inset-0 -z-10 opacity-40" />;
}

/* ════════════════════════════════════════════════
   TYPEWRITER HEADING
   ════════════════════════════════════════════════ */
function TypewriterHeading() {
  const phases = ["Create.", "Mint.", "Trade."];
  const [visibleText, setVisibleText] = useState<string[]>(["", "", ""]);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [glowing, setGlowing] = useState(false);

  useEffect(() => {
    if (currentPhase >= phases.length) {
      const t = setTimeout(() => setGlowing(true), 400);
      return () => clearTimeout(t);
    }

    const word = phases[currentPhase];
    if (currentChar < word.length) {
      const t = setTimeout(() => {
        setVisibleText((prev) => {
          const next = [...prev];
          next[currentPhase] = word.slice(0, currentChar + 1);
          return next;
        });
        setCurrentChar((c) => c + 1);
      }, 60);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setCurrentPhase((p) => p + 1);
        setCurrentChar(0);
      }, 150);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhase, currentChar]);

  const isDone = currentPhase >= phases.length;

  return (
    <>
      {/* Line 1: Create. Mint. */}
      <span
        className={`block ${glowing ? "text-glow-animate" : ""}`}
        style={{
          background: "linear-gradient(135deg, #00E5FF 0%, #A855F7 40%, #EC4899 80%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 0 40px rgba(0,229,255,0.25))",
          minHeight: "1.2em",
        }}
      >
        {visibleText[0]}
        {visibleText[0] && visibleText[1] ? " " : ""}
        {visibleText[1]}
        {!isDone && currentPhase <= 1 && (
          <span className="typewriter-cursor" style={{ color: "#00E5FF" }}>|</span>
        )}
        {!visibleText[0] && <span style={{ visibility: "hidden" }}>Create. Mint.</span>}
      </span>
      {/* Line 2: Trade. */}
      <span
        className={`block ${glowing ? "text-glow-animate" : ""}`}
        style={{
          background: "linear-gradient(135deg, #A855F7 0%, #EC4899 40%, #F97316 80%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          minHeight: "1.2em",
        }}
      >
        {visibleText[2]}
        {!isDone && currentPhase === 2 && (
          <span className="typewriter-cursor" style={{ color: "#A855F7" }}>|</span>
        )}
        {!visibleText[2] && <span style={{ visibility: "hidden" }}>Trade.</span>}
      </span>
    </>
  );
}

/* ════════════════════════════════════════════════
   COUNT-UP VALUE (Intersection Observer triggered)
   ════════════════════════════════════════════════ */
function CountUpValue({
  target,
  formatter,
  duration = 1500,
}: {
  target: number;
  formatter: (n: number) => string;
  duration?: number;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const animated = useRef(false);

  useEffect(() => {
    if (!isInView || animated.current || target <= 0) return;
    animated.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, target, duration]);

  return <span ref={ref}>{formatter(value)}</span>;
}

/* ════════════════════════════════════════════════
   RARITY CIRCLE (SVG circular progress)
   ════════════════════════════════════════════════ */
function RarityCircle({ score, size = 36 }: { score: number; size?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true });
  const r = (size - 4) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? "#A855F7" : score >= 60 ? "#00E5FF" : score >= 40 ? "#22C55E" : "#94A3B8";

  return (
    <svg ref={ref} width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={3}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={isInView ? offset : circumference}
        style={{
          transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
          filter: `drop-shadow(0 0 4px ${color}66)`,
        }}
      />
      <text
        x={size / 2}
        y={size / 2}
        fill={color}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.28}
        fontWeight="bold"
        fontFamily="JetBrains Mono, monospace"
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
      >
        {score}
      </text>
    </svg>
  );
}

/* ════════════════════════════════════════════════
   SVG CONNECTING LINE (How It Works steps)
   ════════════════════════════════════════════════ */
function ConnectingLine() {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <svg
      ref={ref}
      className="absolute left-[19px] top-4 pointer-events-none z-0"
      width="2"
      height="calc(100% - 32px)"
      style={{ height: "calc(100% - 32px)" }}
    >
      <line
        x1="1"
        y1="0"
        x2="1"
        y2="100%"
        stroke="url(#line-gradient)"
        strokeWidth="2"
        strokeDasharray="200"
        strokeDashoffset={isInView ? "0" : "200"}
        style={{
          transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1) 0.5s",
        }}
      />
      <defs>
        <linearGradient id="line-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#A855F7" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#EC4899" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ════════════════════════════════════════════════
   3D TILT CARD
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
      style={{
        transition: "transform 0.4s cubic-bezier(0.2, 0, 0, 1)",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════
   3D NFT CARD (with shimmer badge + rarity circle)
   ════════════════════════════════════════════════ */
function NFTCard3D({ nft }: { nft: ChainNFT }) {
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
    <Link href={`/nft/${nft.tokenId}`}>
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
          <div className="badge-shimmer absolute left-2.5 top-2.5 rounded-full bg-black/70 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold text-neon-cyan border border-neon-cyan/20">
            {nft.aiModel === "dall-e-3" ? "DALL·E 3" : "Stable Diffusion"}
          </div>
          {nft.promptScore != null && nft.promptScore > 0 && (
            <div className="absolute right-2.5 top-2.5">
              <PromptScoreBadge score={nft.promptScore} size="sm" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-transparent" />
        </div>

        <div className="p-4 space-y-2.5 relative" style={{ transform: "translateZ(20px)" }}>
          <p className="truncate text-[11px] text-text-muted font-medium">{nft.collection}</p>
          <p className="truncate text-sm font-bold text-text-primary group-hover:text-neon-cyan transition-colors">
            {nft.name}
          </p>
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-[10px] text-text-muted block">Token</span>
              <span className="font-mono text-sm font-bold text-neon-orange">
                #{nft.tokenId}
              </span>
            </div>
            <div className="text-right flex items-center gap-2">
              <div>
                <span className="text-[10px] text-text-muted block">Score</span>
              </div>
              <RarityCircle score={nft.rarity} size={36} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ════════════════════════════════════════════════
   UTILITY COMPONENTS
   ════════════════════════════════════════════════ */
function StatPill({
  label,
  glow,
  children,
}: {
  label: string;
  glow: string;
  children: React.ReactNode;
}) {
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
      <span className="text-[10px] text-text-muted font-semibold tracking-wide uppercase">
        {label}
      </span>
      <span className="mt-1 text-sm font-bold text-text-primary font-mono">{children}</span>
    </div>
  );
}

function SectionHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div
          className="w-1 h-6 rounded-full"
          style={{ background: "linear-gradient(180deg, #00E5FF, #A855F7)" }}
        />
        <h2 className="font-heading text-lg font-bold text-text-primary tracking-tight">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function StepCard({
  index,
  title,
  color,
  children,
}: {
  index: number;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const colorsMap: Record<string, { bg: string; border: string; text: string }> = {
    cyan: { bg: "rgba(0,229,255,0.1)", border: "rgba(0,229,255,0.2)", text: "#00E5FF" },
    purple: { bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.2)", text: "#A855F7" },
    pink: { bg: "rgba(236,72,153,0.1)", border: "rgba(236,72,153,0.2)", text: "#EC4899" },
  };
  const c = colorsMap[color] || colorsMap.cyan;

  return (
    <div ref={ref} className="neon-card flex gap-3.5 p-3.5 relative z-10">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-black shrink-0 transition-all duration-700"
        style={{
          background: c.bg,
          border: `1px solid ${c.border}`,
          color: c.text,
          clipPath: isInView ? "circle(100% at 50% 50%)" : "circle(0% at 50% 50%)",
          boxShadow: isInView ? `0 0 12px ${c.text}33` : "none",
        }}
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
