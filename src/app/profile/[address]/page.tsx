"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Copy, Check, ExternalLink, Image as ImageIcon, Sparkles,
  Cpu, Loader2, Clock, ArrowUpRight, ArrowRightLeft, Coins, Layers,
  Award,
} from "lucide-react";
import Link from "next/link";
import { truncateAddress, formatNumber, formatStx } from "@/lib/utils";
import { getGatewayUrls } from "@/lib/ipfs";
import { NEURALMINT_COLLECTION } from "@/lib/constants";

// ── Types ───────────────────────────────────────────────

interface NFTData {
  contractId: string;
  tokenId: number;
  name: string;
  description: string;
  collection: string;
  imageUrl: string;
  aiModel: string;
  isNeuralMint: boolean;
  attributes: Array<{ trait_type: string; value: string }>;
}

interface ActivityEvent {
  txId: string;
  type: "mint" | "transfer" | "fee" | "contract-call";
  timestamp: string;
  blockHeight: number;
  tokenId?: number;
  from?: string;
  to?: string;
  amount?: number;
  functionName?: string;
  status: string;
}

interface WalletData {
  address: string;
  balance: { stx: number; stxUsd: number };
  nfts: NFTData[];
  nftCount: number;
  recentActivity: ActivityEvent[];
}

// ── Creator Level ───────────────────────────────────────

function getCreatorLevel(nftCount: number) {
  if (nftCount > 100) return { label: "Visionary", color: "#FFE600", bg: "rgba(255,230,0,0.1)" };
  if (nftCount > 50) return { label: "Master", color: "#A855F7", bg: "rgba(168,85,247,0.1)" };
  if (nftCount > 20) return { label: "Artist", color: "#00E5FF", bg: "rgba(0,229,255,0.1)" };
  if (nftCount > 5) return { label: "Creator", color: "#22C55E", bg: "rgba(34,197,94,0.1)" };
  return { label: "Novice", color: "#6B7280", bg: "rgba(107,114,128,0.1)" };
}

// ── Main ────────────────────────────────────────────────

export default function ProfilePage() {
  const params = useParams();
  const address = params.address as string;
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [bnsName, setBnsName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"created" | "owned" | "activity">("owned");

  const fetchData = useCallback(async () => {
    try {
      const [walletRes, bnsRes] = await Promise.all([
        fetch(`/api/wallet/${address}`),
        fetch(`https://api.mainnet.hiro.so/v1/addresses/stacks/${address}`).catch(() => null),
      ]);

      if (walletRes.ok) setWalletData(await walletRes.json());
      if (bnsRes?.ok) {
        const bnsData = await bnsRes.json();
        if (bnsData.names?.[0]) setBnsName(bnsData.names[0]);
      }
    } catch (err) {
      console.error("Profile fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nmNfts = useMemo(() => walletData?.nfts?.filter((n) => n.isNeuralMint) || [], [walletData]);
  const allNfts = walletData?.nfts || [];
  const level = getCreatorLevel(nmNfts.length);
  const displayName = bnsName || truncateAddress(address);

  // Deterministic avatar color from address
  const avatarGradient = useMemo(() => {
    const hash = address.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const hue1 = hash % 360;
    const hue2 = (hash * 7) % 360;
    return `linear-gradient(135deg, hsl(${hue1},70%,50%), hsl(${hue2},70%,50%))`;
  }, [address]);

  const tabs = ["owned", "created", "activity"] as const;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-neon-cyan" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 overflow-hidden backdrop-blur-sm"
      >
        {/* Banner */}
        <div
          className="relative h-32 sm:h-40"
          style={{ background: avatarGradient, opacity: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0d1117]/80" />
        </div>

        {/* Profile info */}
        <div className="relative px-5 pb-5 sm:px-6">
          <div className="-mt-12 flex flex-wrap items-end gap-4 sm:gap-6">
            {/* Avatar */}
            <div
              className="h-24 w-24 rounded-2xl border-4 border-[#0d1117] flex items-center justify-center shrink-0"
              style={{ background: avatarGradient }}
            >
              <span className="text-2xl font-bold text-white">
                {displayName[0]?.toUpperCase() || "?"}
              </span>
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading text-xl font-semibold text-white truncate">
                  {displayName}
                </h1>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: level.bg, color: level.color, border: `1px solid ${level.color}30` }}
                >
                  <Award size={10} />
                  {level.label}
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="mt-1 inline-flex items-center gap-1.5 text-xs text-white/35 hover:text-neon-cyan transition-colors"
              >
                <span className="font-mono">{truncateAddress(address)}</span>
                {copied ? <Check size={11} className="text-neon-green" /> : <Copy size={11} />}
              </button>
            </div>

            <a
              href={`https://explorer.hiro.so/address/${address}?chain=mainnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-white/30 hover:text-neon-cyan hover:border-neon-cyan/20 transition-all"
            >
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatMini label="Total NFTs" value={formatNumber(allNfts.length)} accent="cyan" />
            <StatMini label="NeuralMint" value={formatNumber(nmNfts.length)} accent="green" />
            <StatMini label="STX Balance" value={formatNumber(walletData?.balance.stx || 0, 2)} accent="orange" />
            <StatMini label="USD Value" value={`$${formatNumber(walletData?.balance.stxUsd || 0, 2)}`} accent="purple" />
          </div>
        </div>
      </motion.section>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-white/[0.06] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab
                ? "border-b-2 border-neon-cyan text-neon-cyan"
                : "text-white/35 hover:text-white/60"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "owned" && <span className="ml-1.5 text-[10px] text-white/20">{allNfts.length}</span>}
            {tab === "created" && <span className="ml-1.5 text-[10px] text-white/20">{nmNfts.length}</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "owned" && <NFTGridSection nfts={allNfts} emptyLabel="No NFTs owned yet" />}
      {activeTab === "created" && <NFTGridSection nfts={nmNfts} emptyLabel="No NeuralMint NFTs created yet" />}
      {activeTab === "activity" && <ActivitySection events={walletData?.recentActivity || []} />}
    </div>
  );
}

// ── Stat Mini ────────────────────────────────────────────

function StatMini({ label, value, accent }: { label: string; value: string; accent: string }) {
  const colors: Record<string, string> = {
    cyan: "text-neon-cyan",
    green: "text-neon-green",
    orange: "text-neon-orange",
    purple: "text-purple-400",
  };

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
      <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
      <p className={`mt-1 font-mono text-base font-semibold ${colors[accent]}`}>{value}</p>
    </div>
  );
}

// ── NFT Grid Section ─────────────────────────────────────

function NFTGridSection({ nfts, emptyLabel }: { nfts: NFTData[]; emptyLabel: string }) {
  if (nfts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 py-20 text-center">
        <ImageIcon size={32} className="text-white/10 mb-3" />
        <p className="text-sm text-white/40">{emptyLabel}</p>
        <Link
          href="/create"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple px-5 py-2 text-xs font-semibold text-white"
        >
          <Sparkles size={14} />
          Create NFT
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {nfts.map((nft) => (
        <ProfileNFTCard key={`${nft.contractId}-${nft.tokenId}`} nft={nft} />
      ))}
    </div>
  );
}

// ── Profile NFT Card ─────────────────────────────────────

function ProfileNFTCard({ nft }: { nft: NFTData }) {
  const [gatewayIdx, setGatewayIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const urls = useMemo(() => getGatewayUrls(nft.imageUrl), [nft.imageUrl]);
  const src = urls[gatewayIdx] || "";

  const onError = useCallback(() => {
    if (gatewayIdx < urls.length - 1) setGatewayIdx((i) => i + 1);
    else setFailed(true);
  }, [gatewayIdx, urls.length]);

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0e14] transition-all hover:border-neon-cyan/25">
      <div className="relative aspect-square overflow-hidden">
        {!loaded && !failed && src && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/[0.02]">
            <Loader2 size={18} className="animate-spin text-white/15" />
          </div>
        )}
        {src && !failed ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt={nft.name}
            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
            onError={onError}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/[0.02]">
            <ImageIcon size={28} className="text-white/10" />
          </div>
        )}
        {nft.aiModel && (
          <span className="absolute left-2 top-2 z-20 inline-flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-[10px] text-white/80 backdrop-blur-md ring-1 ring-white/10">
            <Cpu size={10} />
            {nft.aiModel.toLowerCase().includes("dall") ? "DALL-E 3" : "SDXL"}
          </span>
        )}
        {nft.isNeuralMint && (
          <span className="absolute right-2 top-2 z-20 inline-flex items-center gap-1 rounded-lg bg-neon-green/85 px-2 py-1 text-[10px] font-bold text-black">
            <Sparkles size={9} />
            NM
          </span>
        )}
      </div>
      <div className="p-3.5">
        <h3 className="truncate text-sm font-semibold text-white">{nft.name}</h3>
        <p className="mt-0.5 truncate text-[11px] text-white/30">
          {nft.collection} <span className="text-white/15">·</span> #{nft.tokenId}
        </p>
      </div>
    </article>
  );
}

// ── Activity Section ─────────────────────────────────────

function ActivitySection({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 py-20 text-center">
        <Clock size={28} className="text-white/10 mb-3" />
        <p className="text-sm text-white/40">No activity yet</p>
      </div>
    );
  }

  const config: Record<string, { icon: React.ComponentType<any>; color: string; bg: string; label: string }> = {
    mint: { icon: ArrowUpRight, color: "text-neon-green", bg: "bg-neon-green/10", label: "Minted" },
    transfer: { icon: ArrowRightLeft, color: "text-neon-cyan", bg: "bg-neon-cyan/10", label: "Transfer" },
    fee: { icon: Coins, color: "text-neon-orange", bg: "bg-neon-orange/10", label: "Fee" },
    "contract-call": { icon: Layers, color: "text-purple-400", bg: "bg-purple-500/10", label: "Contract" },
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-5 space-y-0.5">
      {events.map((event) => {
        const c = config[event.type] || config["contract-call"];
        const Icon = c.icon;
        return (
          <a
            key={event.txId}
            href={`https://explorer.hiro.so/txid/${event.txId}?chain=mainnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-white/[0.03] transition-colors"
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.bg} ${c.color}`}>
              <Icon size={13} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-white/70">
                <span className={`font-medium ${c.color}`}>{c.label}</span>
                {event.tokenId ? ` #${event.tokenId}` : ""}
                {event.functionName && event.type === "contract-call" ? ` — ${event.functionName}` : ""}
              </p>
              <p className="text-[10px] text-white/25">
                {event.amount ? `${event.amount.toFixed(2)} STX · ` : ""}
                {event.timestamp ? new Date(event.timestamp).toLocaleDateString() : ""}
              </p>
            </div>
            <div className={`h-1.5 w-1.5 rounded-full ${event.status === "success" ? "bg-neon-green" : "bg-neon-orange"}`} />
          </a>
        );
      })}
    </div>
  );
}
