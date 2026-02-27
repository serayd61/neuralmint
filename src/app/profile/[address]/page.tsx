"use client";

import { useParams } from "next/navigation";
import { mockNFTs, mockCreators } from "@/lib/mock-data";
import { formatNumber, formatStx, truncateAddress } from "@/lib/utils";
import { Heart, ShoppingCart, Settings, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function ProfilePage() {
  const params = useParams();
  const address = params.address as string;
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"owned" | "created" | "activity">("owned");
  
  const creator = mockCreators.find(c => c.address === address) || {
    address,
    bnsName: truncateAddress(address),
    avatarUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${address}`,
    followers: 0,
    following: 0,
    totalSalesStx: 0,
    isVerified: false,
  };

  const userNFTs = mockNFTs.slice(0, 6);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <section className="neon-card overflow-hidden">
        <div className="relative h-40 bg-gradient-to-r from-neon-purple/30 via-neon-cyan/20 to-neon-pink/30">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        </div>
        <div className="relative px-6 pb-6">
          <div className="-mt-16 flex flex-wrap items-end gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={creator.avatarUrl}
              alt={creator.bnsName}
              className="h-32 w-32 rounded-full border-4 border-bg-primary object-cover"
            />
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-2xl font-semibold text-text-primary">
                  {creator.bnsName}
                </h1>
                {creator.isVerified && (
                  <span className="rounded-full bg-neon-cyan/20 px-2 py-0.5 text-[10px] text-neon-cyan">
                    Verified
                  </span>
                )}
              </div>
              <button
                onClick={handleCopy}
                className="mt-1 flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary transition-colors"
              >
                <span className="font-mono">{truncateAddress(address)}</span>
                {copied ? <Check size={14} className="text-neon-green" /> : <Copy size={14} />}
              </button>
            </div>
            <div className="flex gap-2 pb-2">
              <button className="btn-primary text-sm">Follow</button>
              <button className="btn-secondary flex items-center gap-2 text-sm">
                <Share2 size={14} />
              </button>
              <button className="p-2 rounded-lg border border-white/10 text-text-secondary hover:text-text-primary transition-colors">
                <Settings size={18} />
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-bg-card/50 p-3">
              <p className="text-xs text-text-muted">Total Sales</p>
              <p className="mt-1 font-mono text-lg text-neon-green">
                {formatStx(creator.totalSalesStx * 1_000_000, 0)}
              </p>
            </div>
            <div className="rounded-lg bg-bg-card/50 p-3">
              <p className="text-xs text-text-muted">NFTs Owned</p>
              <p className="mt-1 text-lg text-text-primary">{userNFTs.length}</p>
            </div>
            <div className="rounded-lg bg-bg-card/50 p-3">
              <p className="text-xs text-text-muted">Followers</p>
              <p className="mt-1 text-lg text-text-primary">{formatNumber(creator.followers)}</p>
            </div>
            <div className="rounded-lg bg-bg-card/50 p-3">
              <p className="text-xs text-text-muted">Following</p>
              <p className="mt-1 text-lg text-text-primary">{formatNumber((creator as any).following || 0)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="flex gap-1 border-b border-white/10">
        {(["owned", "created", "activity"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-neon-cyan text-neon-cyan"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </section>

      {/* NFT Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {userNFTs.map((nft) => (
          <article key={nft.id} className="neon-card overflow-hidden group">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={nft.imageUrl}
                alt={nft.name}
                className="h-48 w-full object-cover transition-transform group-hover:scale-105"
              />
              <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-0.5 text-[10px] text-neon-cyan">
                {nft.aiModel === "dall-e-3" ? "DALL·E 3" : "Stable Diffusion"}
              </span>
              <button className="absolute right-2 top-2 rounded-full bg-black/65 p-1.5 text-text-secondary hover:text-neon-pink transition-colors">
                <Heart size={14} />
              </button>
            </div>
            <div className="space-y-2 p-3">
              <p className="truncate text-xs text-text-muted">{nft.collection}</p>
              <p className="truncate text-sm font-medium text-text-primary">{nft.name}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-neon-orange">{nft.priceStx.toFixed(2)} STX</span>
                <span className="text-text-muted">Rarity {nft.rarity}</span>
              </div>
              <button className="w-full rounded-md border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-1.5 text-xs text-neon-cyan hover:bg-neon-cyan/20 transition-colors">
                <span className="inline-flex items-center gap-1">
                  <ShoppingCart size={12} />
                  Buy Now
                </span>
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
