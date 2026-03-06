"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { formatNumber } from "@/lib/utils";
import { useWalletStore } from "@/stores/wallet-store";
import { NEURALMINT_COLLECTION } from "@/lib/constants";
import { getGatewayUrls } from "@/lib/ipfs";
import Link from "next/link";
import {
  Wallet,
  Image as ImageIcon,
  Layers,
  TrendingUp,
  Cpu,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ArrowRightLeft,
  Tag,
  Coins,
  Clock,
  Loader2,
  Eye,
  Grid3X3,
  List,
  ChevronRight,
} from "lucide-react";

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

interface CollectionData {
  contractId: string;
  name: string;
  symbol: string;
  totalMinted: number;
  floorPrice: number;
  volume: number;
}

// ── Main Dashboard ──────────────────────────────────────

export default function DashboardPage() {
  const { stxAddress, isConnected, bnsName } = useWalletStore();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [stxPrice, setStxPrice] = useState(1.5);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "neuralmint">("all");
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fetchData = useCallback(async () => {
    if (!stxAddress) return;
    try {
      const [walletRes, collectionsRes, priceRes] = await Promise.all([
        fetch(`/api/wallet/${stxAddress}`),
        fetch("/api/collections"),
        fetch("/api/price"),
      ]);

      if (walletRes.ok) setWalletData(await walletRes.json());
      if (collectionsRes.ok) {
        const d = await collectionsRes.json();
        setCollection(d.collections?.[0] || null);
      }
      if (priceRes.ok) {
        const d = await priceRes.json();
        setStxPrice(d.price || 1.5);
      }
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [stxAddress]);

  useEffect(() => {
    if (!stxAddress) {
      setLoading(false);
      return;
    }
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [stxAddress, fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCopy = () => {
    if (stxAddress) {
      navigator.clipboard.writeText(stxAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredNfts =
    walletData?.nfts?.filter((nft) =>
      activeTab === "all" ? true : nft.isNeuralMint
    ) || [];

  // ── Not connected ──
  if (!isConnected || !stxAddress) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl border border-white/[0.06] bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10">
            <Wallet size={36} className="text-neon-cyan" />
          </div>
          <h2 className="text-2xl font-semibold text-white">
            Connect Your Wallet
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/40">
            Connect your Stacks wallet to view your NFT collection, balances,
            and on-chain activity.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 size={28} className="mx-auto animate-spin text-neon-cyan" />
            <p className="mt-4 text-sm text-white/40">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const nmCount = walletData?.nfts?.filter((n) => n.isNeuralMint).length || 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <header className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-purple">
              <span className="text-lg font-bold text-white">
                {(bnsName || stxAddress)?.[0]?.toUpperCase() || "N"}
              </span>
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0d1117] bg-neon-green" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-semibold text-white">
                {bnsName || "My Dashboard"}
              </h1>
              <button
                onClick={handleCopy}
                className="group inline-flex items-center gap-1.5 text-xs text-white/35 transition-colors hover:text-neon-cyan"
              >
                <span className="font-mono">
                  {stxAddress.slice(0, 8)}...{stxAddress.slice(-6)}
                </span>
                {copied ? (
                  <Check size={11} className="text-neon-green" />
                ) : (
                  <Copy size={11} className="opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
              <div className="text-right">
                <p className="font-mono text-sm font-semibold text-white">
                  {formatNumber(walletData?.balance.stx || 0, 2)}{" "}
                  <span className="text-white/40">STX</span>
                </p>
                <p className="text-[10px] text-white/30">
                  ~${formatNumber((walletData?.balance.stx || 0) * stxPrice, 2)}
                </p>
              </div>
              <div className="h-8 w-px bg-white/[0.06]" />
              <div className="text-right">
                <p className="font-mono text-sm font-semibold text-neon-cyan">
                  ${stxPrice.toFixed(2)}
                </p>
                <p className="text-[10px] text-white/30">STX/USD</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-white/40 transition-all hover:border-neon-cyan/20 hover:text-neon-cyan disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Stats ── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ImageIcon}
          label="Total NFTs"
          value={formatNumber(walletData?.nftCount || 0)}
          sub={nmCount > 0 ? `${nmCount} NeuralMint` : undefined}
          accent="cyan"
        />
        <StatCard
          icon={Layers}
          label="Collection Minted"
          value={formatNumber(collection?.totalMinted || 0)}
          sub="on-chain"
          accent="green"
        />
        <StatCard
          icon={Wallet}
          label="STX Balance"
          value={formatNumber(walletData?.balance.stx || 0, 2)}
          sub={`~$${formatNumber((walletData?.balance.stx || 0) * stxPrice, 2)}`}
          accent="orange"
        />
        <StatCard
          icon={TrendingUp}
          label="STX Price"
          value={`$${stxPrice.toFixed(2)}`}
          sub="live"
          accent="purple"
        />
      </section>

      {/* ── NFT Gallery + Activity ── */}
      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* NFT Gallery */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-5 backdrop-blur-sm">
          {/* Gallery Header */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-white">My NFTs</h2>
              <span className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-white/40">
                {filteredNfts.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Tab Switcher */}
              <div className="flex items-center rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5 text-[11px]">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`rounded-md px-3 py-1.5 font-medium transition-all ${
                    activeTab === "all"
                      ? "bg-neon-cyan/10 text-neon-cyan"
                      : "text-white/35 hover:text-white/60"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTab("neuralmint")}
                  className={`rounded-md px-3 py-1.5 font-medium transition-all ${
                    activeTab === "neuralmint"
                      ? "bg-neon-cyan/10 text-neon-cyan"
                      : "text-white/35 hover:text-white/60"
                  }`}
                >
                  NeuralMint
                </button>
              </div>
              {/* View Toggle */}
              <div className="flex items-center rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded-md p-1.5 transition-all ${
                    viewMode === "grid" ? "bg-white/[0.06] text-white" : "text-white/25 hover:text-white/50"
                  }`}
                >
                  <Grid3X3 size={13} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded-md p-1.5 transition-all ${
                    viewMode === "list" ? "bg-white/[0.06] text-white" : "text-white/25 hover:text-white/50"
                  }`}
                >
                  <List size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* NFT Grid / List */}
          {filteredNfts.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredNfts.map((nft) => (
                  <NFTCard key={`${nft.contractId}-${nft.tokenId}`} nft={nft} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNfts.map((nft) => (
                  <NFTListItem key={`${nft.contractId}-${nft.tokenId}`} nft={nft} />
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <ImageIcon size={28} className="text-white/15" />
              </div>
              <p className="text-sm font-medium text-white/50">No NFTs found</p>
              <p className="mt-1 text-xs text-white/25">
                Create your first AI-generated NFT
              </p>
              <Link
                href="/create"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple px-6 py-2.5 text-xs font-semibold text-white transition-all hover:shadow-lg hover:shadow-neon-cyan/20"
              >
                <Sparkles size={14} />
                Create NFT
              </Link>
            </div>
          )}
        </div>

        {/* Activity Sidebar */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Activity</h2>
            <Clock size={13} className="text-white/20" />
          </div>

          {walletData?.recentActivity && walletData.recentActivity.length > 0 ? (
            <div className="space-y-0.5">
              {walletData.recentActivity.slice(0, 12).map((event) => (
                <ActivityRow key={event.txId} event={event} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock size={20} className="mb-2 text-white/15" />
              <p className="text-xs text-white/30">No activity yet</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Collection Overview ── */}
      {collection && (
        <section className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-neon-cyan/15 to-neon-green/15 ring-1 ring-white/[0.06]">
                <Sparkles size={18} className="text-neon-cyan" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {collection.name}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-white/25">
                  {NEURALMINT_COLLECTION.contractId.slice(0, 20)}...
                  {NEURALMINT_COLLECTION.contractId.slice(-12)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="font-mono text-lg font-semibold text-neon-green">
                  {collection.totalMinted}
                </p>
                <p className="text-[10px] text-white/30">Minted</p>
              </div>
              <a
                href={`https://explorer.hiro.so/txid/${NEURALMINT_COLLECTION.contractId}?chain=mainnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-white/30 transition-all hover:border-neon-cyan/20 hover:text-neon-cyan"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── Quick Actions ── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          icon={Sparkles}
          title="Create NFT"
          desc="AI-powered generation"
          href="/create"
          accent="cyan"
        />
        <ActionCard
          icon={Eye}
          title="Explore"
          desc="Browse marketplace"
          href="/explore"
          accent="green"
        />
        <ActionCard
          icon={Tag}
          title="Prompt Vault"
          desc="Prompt leaderboard"
          href="/prompts"
          accent="orange"
        />
        <ActionCard
          icon={Wallet}
          title="Profile"
          desc="Your public profile"
          href={`/profile/${stxAddress}`}
          accent="purple"
        />
      </section>
    </div>
  );
}

// ── NFT Card (Grid) ─────────────────────────────────────

function NFTCard({ nft }: { nft: NFTData }) {
  const [gatewayIdx, setGatewayIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const urls = useMemo(() => getGatewayUrls(nft.imageUrl), [nft.imageUrl]);
  const src = urls[gatewayIdx] || "";

  const onError = useCallback(() => {
    if (gatewayIdx < urls.length - 1) {
      setGatewayIdx((i) => i + 1);
    } else {
      setFailed(true);
    }
  }, [gatewayIdx, urls.length]);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0e14] transition-all duration-300 hover:border-neon-cyan/25 hover:shadow-[0_0_40px_-12px_rgba(0,245,255,0.12)]">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        {/* Skeleton */}
        {!loaded && !failed && src && (
          <div className="absolute inset-0 z-10">
            <div className="h-full w-full animate-pulse bg-gradient-to-br from-white/[0.02] via-white/[0.05] to-white/[0.02]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={18} className="animate-spin text-white/15" />
            </div>
          </div>
        )}

        {src && !failed ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt={nft.name}
            className={`h-full w-full object-cover transition-all duration-700 group-hover:scale-110 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setLoaded(true)}
            onError={onError}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon-cyan/[0.03] to-neon-purple/[0.03]">
            <div className="text-center">
              <ImageIcon size={32} className="mx-auto text-white/10" />
              <p className="mt-2 text-[10px] text-white/15">No Image</p>
            </div>
          </div>
        )}

        {/* Permanent gradient at bottom for readability */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0a0e14] to-transparent" />

        {/* AI Model Badge */}
        {nft.aiModel && (
          <span className="absolute left-2.5 top-2.5 z-20 inline-flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-[10px] font-medium text-white/80 backdrop-blur-md ring-1 ring-white/10">
            <Cpu size={10} />
            {nft.aiModel.toLowerCase().includes("dall") ? "DALL-E 3" : "SDXL"}
          </span>
        )}

        {/* NeuralMint Badge */}
        {nft.isNeuralMint && (
          <span className="absolute right-2.5 top-2.5 z-20 inline-flex items-center gap-1 rounded-lg bg-neon-green/85 px-2 py-1 text-[10px] font-bold text-black backdrop-blur-md">
            <Sparkles size={9} />
            NM
          </span>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-x-0 bottom-0 z-20 translate-y-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          {nft.description && (
            <p className="line-clamp-2 text-[11px] leading-relaxed text-white/60">
              {nft.description}
            </p>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <h3 className="truncate text-sm font-semibold text-white">
          {nft.name}
        </h3>
        <p className="mt-0.5 truncate text-[11px] text-white/30">
          {nft.collection}{" "}
          <span className="text-white/15">·</span> #{nft.tokenId}
        </p>

        {/* Attributes */}
        {nft.attributes.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {nft.attributes.slice(0, 3).map((attr) => (
              <span
                key={attr.trait_type}
                className="rounded-md bg-white/[0.03] px-1.5 py-0.5 text-[9px] text-white/30 ring-1 ring-white/[0.05]"
              >
                {attr.value}
              </span>
            ))}
            {nft.attributes.length > 3 && (
              <span className="rounded-md px-1.5 py-0.5 text-[9px] text-white/20">
                +{nft.attributes.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// ── NFT List Item ───────────────────────────────────────

function NFTListItem({ nft }: { nft: NFTData }) {
  const [gatewayIdx, setGatewayIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const urls = useMemo(() => getGatewayUrls(nft.imageUrl), [nft.imageUrl]);
  const src = urls[gatewayIdx] || "";

  const onError = useCallback(() => {
    if (gatewayIdx < urls.length - 1) {
      setGatewayIdx((i) => i + 1);
    } else {
      setFailed(true);
    }
  }, [gatewayIdx, urls.length]);

  return (
    <article className="group flex items-center gap-4 rounded-xl border border-white/[0.04] bg-white/[0.01] p-2.5 transition-all hover:border-neon-cyan/15 hover:bg-white/[0.02]">
      {/* Thumbnail */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/[0.03]">
        {src && !failed ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt={nft.name}
            className={`h-full w-full object-cover transition-opacity ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setLoaded(true)}
            onError={onError}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon size={16} className="text-white/10" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-white">{nft.name}</h3>
        <p className="truncate text-[11px] text-white/30">
          {nft.collection} · #{nft.tokenId}
        </p>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2">
        {nft.aiModel && (
          <span className="hidden items-center gap-1 rounded-md bg-white/[0.04] px-2 py-1 text-[10px] text-white/40 sm:inline-flex">
            <Cpu size={10} />
            {nft.aiModel.toLowerCase().includes("dall") ? "DALL-E 3" : "SDXL"}
          </span>
        )}
        {nft.isNeuralMint && (
          <span className="inline-flex items-center gap-1 rounded-md bg-neon-green/10 px-2 py-1 text-[10px] font-medium text-neon-green">
            NM
          </span>
        )}
        <ChevronRight size={14} className="text-white/15" />
      </div>
    </article>
  );
}

// ── Stat Card ───────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "cyan",
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  sub?: string;
  accent?: "green" | "cyan" | "orange" | "purple";
}) {
  const colors = {
    green: { text: "text-neon-green", bg: "from-neon-green/8", border: "border-neon-green/10" },
    cyan: { text: "text-neon-cyan", bg: "from-neon-cyan/8", border: "border-neon-cyan/10" },
    orange: { text: "text-neon-orange", bg: "from-neon-orange/8", border: "border-neon-orange/10" },
    purple: { text: "text-purple-400", bg: "from-purple-500/8", border: "border-purple-500/10" },
  };
  const c = colors[accent];

  return (
    <article className={`rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-4 backdrop-blur-sm ${c.border}`}>
      <div className="mb-2.5 flex items-center gap-2.5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${c.bg} to-transparent`}>
          <Icon size={14} className={c.text} />
        </div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-white/30">
          {label}
        </p>
      </div>
      <p className={`font-mono text-xl font-semibold ${c.text}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-white/25">{sub}</p>}
    </article>
  );
}

// ── Activity Row ────────────────────────────────────────

function ActivityRow({ event }: { event: ActivityEvent }) {
  const config: Record<
    string,
    { icon: React.ComponentType<any>; color: string; bg: string; label: string }
  > = {
    mint: { icon: ArrowUpRight, color: "text-neon-green", bg: "bg-neon-green/10", label: "Minted" },
    transfer: { icon: ArrowRightLeft, color: "text-neon-cyan", bg: "bg-neon-cyan/10", label: "Transfer" },
    fee: { icon: Coins, color: "text-neon-orange", bg: "bg-neon-orange/10", label: "Fee" },
    "contract-call": { icon: Layers, color: "text-purple-400", bg: "bg-purple-500/10", label: "Contract" },
  };

  const c = config[event.type] || config["contract-call"];
  const Icon = c.icon;
  const timeAgo = getTimeAgo(event.timestamp);

  return (
    <a
      href={`https://explorer.hiro.so/txid/${event.txId}?chain=mainnet`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.03]"
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.bg} ${c.color}`}
      >
        <Icon size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-white/70">
          <span className={`font-medium ${c.color}`}>{c.label}</span>
          {event.tokenId ? ` #${event.tokenId}` : ""}
          {event.functionName && event.type === "contract-call"
            ? ` — ${event.functionName}`
            : ""}
        </p>
        <p className="text-[10px] text-white/25">
          {event.amount ? `${event.amount.toFixed(2)} STX · ` : ""}
          {timeAgo}
        </p>
      </div>
      <div
        className={`h-1.5 w-1.5 rounded-full ${
          event.status === "success" ? "bg-neon-green" : "bg-neon-orange"
        }`}
      />
    </a>
  );
}

// ── Action Card ─────────────────────────────────────────

function ActionCard({
  icon: Icon,
  title,
  desc,
  href,
  accent = "cyan",
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
  href: string;
  accent?: "green" | "cyan" | "orange" | "purple";
}) {
  const colors = {
    green: { text: "text-neon-green", hover: "hover:border-neon-green/20" },
    cyan: { text: "text-neon-cyan", hover: "hover:border-neon-cyan/20" },
    orange: { text: "text-neon-orange", hover: "hover:border-neon-orange/20" },
    purple: { text: "text-purple-400", hover: "hover:border-purple-500/20" },
  };
  const c = colors[accent];

  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-4 backdrop-blur-sm transition-all ${c.hover}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06] transition-all group-hover:ring-white/10">
        <Icon size={18} className={c.text} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-[11px] text-white/30">{desc}</p>
      </div>
      <ChevronRight
        size={14}
        className="text-white/10 transition-all group-hover:translate-x-0.5 group-hover:text-white/30"
      />
    </Link>
  );
}

// ── Helpers ──────────────────────────────────────────────

function getTimeAgo(timestamp: string): string {
  if (!timestamp) return "";
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
