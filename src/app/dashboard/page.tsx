"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/utils";

interface WalletData {
  address: string;
  balance: { stx: number; stxUsd: number };
  nfts: Array<{
    contractId: string;
    tokenId: number;
    name: string;
    collection: string;
    imageUrl: string;
  }>;
  nftCount: number;
}

interface CollectionData {
  contractId: string;
  name: string;
  symbol: string;
  totalMinted: number;
  maxSupply: number;
  floorPrice: number;
  volume: number;
}

interface PriceData {
  price: number;
}

const OWNER_ADDRESS = "SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB";

export default function DashboardPage() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [stxPrice, setStxPrice] = useState<number>(1.50);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "listed">("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const [walletRes, collectionsRes, priceRes] = await Promise.all([
          fetch(`/api/wallet/${OWNER_ADDRESS}`),
          fetch("/api/collections"),
          fetch("/api/price"),
        ]);

        if (walletRes.ok) {
          const data = await walletRes.json();
          setWalletData(data);
        }

        if (collectionsRes.ok) {
          const data = await collectionsRes.json();
          setCollections(data.collections || []);
        }

        if (priceRes.ok) {
          const data: PriceData = await priceRes.json();
          setStxPrice(data.price);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const totalMinted = collections.reduce((sum, c) => sum + c.totalMinted, 0);
  const totalVolume = collections.reduce((sum, c) => sum + c.volume, 0);
  const portfolioValue = walletData?.nfts?.reduce((sum, nft) => {
    const collection = collections.find(c => c.contractId === nft.contractId);
    return sum + (collection?.floorPrice || 25);
  }, 0) || 0;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-neon-green border-t-transparent" />
            <p className="mt-4 text-sm text-text-muted">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">My Account</p>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">Dashboard</h1>
          <p className="mt-1 text-xs text-text-secondary">
            Welcome back, <span className="text-neon-cyan">serkan.btc</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-neon-green/20 bg-neon-green/10 px-3 py-1.5">
            <span className="text-[10px] text-text-muted">STX Balance</span>
            <p className="font-mono text-sm font-semibold text-neon-green">
              {formatNumber(walletData?.balance.stx || 0, 2)} STX
            </p>
          </div>
          <div className="rounded-lg border border-neon-cyan/20 bg-neon-cyan/10 px-3 py-1.5">
            <span className="text-[10px] text-text-muted">STX/USD</span>
            <p className="font-mono text-sm font-semibold text-neon-cyan">${stxPrice.toFixed(2)}</p>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Portfolio Value"
          value={`${formatNumber(portfolioValue, 0)} STX`}
          helper={`~$${formatNumber(portfolioValue * stxPrice, 0)}`}
          color="green"
        />
        <StatCard
          label="NFTs Owned"
          value={formatNumber(walletData?.nftCount || 0)}
          helper={`across ${collections.length} collections`}
          color="cyan"
        />
        <StatCard
          label="Total Minted"
          value={formatNumber(totalMinted)}
          helper="from your collections"
          color="orange"
        />
        <StatCard
          label="Total Volume"
          value={`${formatNumber(totalVolume, 0)} STX`}
          helper={`~$${formatNumber(totalVolume * stxPrice, 0)}`}
          color="purple"
        />
      </section>

      {/* Main Content */}
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Portfolio Overview */}
        <div className="neon-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Your Collections</h2>
          <div className="space-y-3">
            {collections.map((collection) => (
              <div
                key={collection.contractId}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-bg-card p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-neon-green">{collection.symbol}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{collection.name}</p>
                    <p className="text-[11px] text-text-muted">
                      {collection.totalMinted}/{collection.maxSupply} minted
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-neon-orange">
                    {collection.floorPrice} STX
                  </p>
                  <p className="text-[11px] text-text-muted">floor</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Snapshot */}
        <div className="neon-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Market Snapshot</h2>
          <div className="space-y-2 text-xs text-text-secondary">
            <Line label="STX/USD" value={`$${stxPrice.toFixed(2)}`} highlight />
            <Line label="Total Volume" value={`${formatNumber(totalVolume, 0)} STX`} />
            <Line label="Collections" value={formatNumber(collections.length)} />
            <Line
              label="Avg Floor"
              value={`${formatNumber(
                collections.length > 0
                  ? collections.reduce((s, c) => s + c.floorPrice, 0) / collections.length
                  : 0,
                1
              )} STX`}
            />
          </div>
          <div className="mt-4 rounded-lg border border-neon-green/20 bg-neon-green/5 p-3">
            <p className="text-[11px] text-text-muted">Your Wallet</p>
            <p className="mt-1 font-mono text-xs text-neon-green break-all">
              {OWNER_ADDRESS.slice(0, 20)}...
            </p>
          </div>
        </div>
      </section>

      {/* NFTs Section */}
      <section className="neon-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">My NFTs</h2>
          <div className="inline-flex items-center rounded-md border border-white/10 bg-bg-card p-1 text-[11px]">
            <button
              onClick={() => setActiveTab("all")}
              className={`rounded px-3 py-1.5 transition-colors ${
                activeTab === "all"
                  ? "bg-neon-green/20 text-neon-green"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              All ({walletData?.nftCount || 0})
            </button>
            <button
              onClick={() => setActiveTab("listed")}
              className={`rounded px-3 py-1.5 transition-colors ${
                activeTab === "listed"
                  ? "bg-neon-green/20 text-neon-green"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Listed
            </button>
          </div>
        </div>

        {walletData?.nfts && walletData.nfts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {walletData.nfts.map((nft) => (
              <article
                key={`${nft.contractId}-${nft.tokenId}`}
                className="group rounded-xl border border-white/10 bg-bg-card overflow-hidden transition-all hover:border-neon-green/50 hover:shadow-lg hover:shadow-neon-green/10"
              >
                <div className="relative aspect-square overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={nft.imageUrl}
                    alt={nft.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-full rounded-lg bg-neon-green py-2 text-xs font-semibold text-black">
                      List for Sale
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-text-primary">{nft.name}</p>
                  <p className="text-[11px] text-text-muted">{nft.collection}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-text-muted">Floor</span>
                    <span className="font-mono text-xs text-neon-orange">
                      {collections.find((c) => c.contractId === nft.contractId)?.floorPrice || 25} STX
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 h-16 w-16 rounded-full bg-bg-card flex items-center justify-center">
              <span className="text-2xl">🖼️</span>
            </div>
            <p className="text-sm text-text-muted">No NFTs found in your wallet</p>
            <p className="mt-1 text-xs text-text-muted">
              Mint some NFTs from your collections to see them here
            </p>
            <a
              href="/create"
              className="mt-4 rounded-lg bg-neon-green px-6 py-2 text-sm font-semibold text-black transition-all hover:bg-neon-green/90"
            >
              Create NFT
            </a>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          icon="🎨"
          title="Create NFT"
          description="Mint a new AI-generated NFT"
          href="/create"
        />
        <ActionCard
          icon="🏪"
          title="Explore"
          description="Browse the marketplace"
          href="/explore"
        />
        <ActionCard
          icon="📦"
          title="Collections"
          description="View all collections"
          href="/collections"
        />
        <ActionCard
          icon="👤"
          title="Profile"
          description="Manage your profile"
          href="/profile"
        />
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  color = "green",
}: {
  label: string;
  value: string;
  helper: string;
  color?: "green" | "cyan" | "orange" | "purple";
}) {
  const colorClasses = {
    green: "border-neon-green/20 bg-neon-green/5",
    cyan: "border-neon-cyan/20 bg-neon-cyan/5",
    orange: "border-neon-orange/20 bg-neon-orange/5",
    purple: "border-purple-500/20 bg-purple-500/5",
  };

  const textClasses = {
    green: "text-neon-green",
    cyan: "text-neon-cyan",
    orange: "text-neon-orange",
    purple: "text-purple-400",
  };

  return (
    <article className={`neon-card p-4 border ${colorClasses[color]}`}>
      <p className="text-[11px] uppercase tracking-[0.15em] text-text-muted">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${textClasses[color]}`}>{value}</p>
      <p className="mt-1 text-[11px] text-text-secondary">{helper}</p>
    </article>
  );
}

function Line({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <p className="flex items-center justify-between rounded-md bg-bg-card px-2.5 py-2">
      <span>{label}</span>
      <span className={`font-mono ${highlight ? "text-neon-green" : "text-text-primary"}`}>
        {value}
      </span>
    </p>
  );
}

function ActionCard({
  icon,
  title,
  description,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="neon-card flex items-center gap-4 p-4 transition-all hover:border-neon-green/50 hover:bg-neon-green/5"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg-card text-2xl">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="text-[11px] text-text-muted">{description}</p>
      </div>
    </a>
  );
}
