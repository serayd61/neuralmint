"use client";

import { useState } from "react";
import { SlidersHorizontal, Search, Heart, Gavel, ShoppingCart, Loader2 } from "lucide-react";
import { mockNFTs } from "@/lib/mock-data";
import { buyItem } from "@/lib/contracts";
import { useWalletStore } from "@/stores/wallet-store";
import { NFT_CONTRACT_ADDRESS, NFT_CONTRACT_NAME } from "@/lib/constants";

export default function ExplorePage() {
  const { isConnected } = useWalletStore();
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filters, setFilters] = useState<string[]>(["Buy Now"]);

  const handleBuy = async (nft: typeof mockNFTs[0]) => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    setBuyingId(nft.id);
    try {
      // In production, this would use the actual listing ID from the contract
      await buyItem({
        listingId: parseInt(nft.id),
        nftContract: `${NFT_CONTRACT_ADDRESS}.${NFT_CONTRACT_NAME}`,
      });
    } catch (error) {
      console.error("Buy failed:", error);
    } finally {
      setBuyingId(null);
    }
  };

  const toggleFilter = (filter: string) => {
    setFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  const filteredNFTs = mockNFTs.filter((nft) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        nft.name.toLowerCase().includes(query) ||
        nft.collection?.toLowerCase().includes(query) ||
        nft.creator.bnsName.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const sortedNFTs = [...filteredNFTs].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.priceStx - b.priceStx;
      case "price-high":
        return b.priceStx - a.priceStx;
      case "rarity":
        return b.rarity - a.rarity;
      default:
        return 0;
    }
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Marketplace</p>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">Explore NFTs</h1>
        </div>
        <div className="inline-flex items-center rounded-lg border border-white/10 bg-bg-card/70 p-1 text-xs">
          <button className="rounded-md bg-bg-hover px-3 py-1.5 text-text-primary">Grid</button>
          <button className="rounded-md px-3 py-1.5 text-text-muted">List</button>
        </div>
      </header>

      <section className="glass rounded-xl border border-white/10 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search NFTs, collections, creators..."
              className="w-full rounded-lg border border-white/10 bg-bg-card pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-cyan/50 focus:outline-none"
            />
          </label>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-xs text-text-secondary hover:text-neon-cyan">
            <SlidersHorizontal size={15} />
            Filters
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-xs text-text-secondary focus:border-neon-cyan/50 focus:outline-none"
          >
            <option value="recent">Recently Listed</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rarity">Highest Rarity</option>
          </select>
          <button
            onClick={() => {
              setSearchQuery("");
              setFilters([]);
            }}
            className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-2.5 text-xs text-neon-cyan"
          >
            Clear
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          {["Buy Now", "On Auction", "DALL-E 3", "Rare+"].map((chip) => (
            <button
              key={chip}
              onClick={() => toggleFilter(chip)}
              className={`rounded-full border px-2.5 py-1 transition-all ${
                filters.includes(chip)
                  ? "border-neon-purple/40 bg-neon-purple/20 text-neon-purple"
                  : "border-white/10 bg-bg-card text-text-muted hover:border-neon-purple/20"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedNFTs.map((nft) => (
          <article key={nft.id} className="neon-card overflow-hidden group">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={nft.imageUrl}
                alt={nft.name}
                className="h-48 w-full object-cover transition-transform group-hover:scale-105"
              />
              <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-0.5 text-[10px] text-neon-cyan">
                {nft.aiModel === "dall-e-3" ? "DALL-E 3" : "Stable Diffusion"}
              </span>
              <button className="absolute right-2 top-2 rounded-full bg-black/65 p-1.5 text-text-secondary hover:text-neon-pink transition-colors">
                <Heart size={13} />
              </button>
            </div>
            <div className="space-y-2 p-3">
              <p className="truncate text-xs text-text-muted">{nft.collection || "NeuralMint"}</p>
              <h3 className="truncate text-sm font-semibold text-text-primary">{nft.name}</h3>
              <p className="truncate text-[11px] text-text-secondary">{nft.creator.bnsName}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-neon-orange">{nft.priceStx.toFixed(2)} STX</span>
                <span className="text-text-muted">Rarity {nft.rarity}</span>
              </div>
              <div className="flex gap-2 pt-1">
                {nft.isAuction ? (
                  <button className="flex-1 rounded-md border border-neon-purple/30 bg-neon-purple/10 px-2 py-1.5 text-[11px] text-neon-purple hover:bg-neon-purple/20 transition-colors">
                    <span className="inline-flex items-center gap-1">
                      <Gavel size={12} />
                      Place Bid
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuy(nft)}
                    disabled={buyingId === nft.id}
                    className="flex-1 rounded-md border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-1.5 text-[11px] text-neon-cyan hover:bg-neon-cyan/20 transition-colors disabled:opacity-50"
                  >
                    <span className="inline-flex items-center gap-1">
                      {buyingId === nft.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <ShoppingCart size={12} />
                      )}
                      {buyingId === nft.id ? "Buying..." : "Buy Now"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      {sortedNFTs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg text-text-secondary">No NFTs found</p>
          <p className="mt-2 text-sm text-text-muted">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
