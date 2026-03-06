"use client";

import { useState, useMemo } from "react";
import { mockNFTs } from "@/lib/mock-data";
import { buyItem } from "@/lib/contracts";
import { useWalletStore } from "@/stores/wallet-store";
import { NFT_CONTRACT_ADDRESS, NFT_CONTRACT_NAME } from "@/lib/constants";
import { getPromptTier } from "@/lib/prompt-utils";
import { ExploreHero } from "./_components/ExploreHero";
import { FilterBar } from "./_components/FilterBar";
import { NFTGrid } from "./_components/NFTGrid";
import { NFTDetailModal } from "./_components/NFTDetailModal";
import type { ExploreFilters } from "@/lib/types";
import type { MockNFT } from "@/lib/mock-data";

const DEFAULT_FILTERS: ExploreFilters = {
  search: "",
  category: null,
  aiModel: null,
  priceRange: [0, 10000],
  promptScoreRange: [0, 100],
  promptTier: null,
  sortBy: "trending",
  saleType: "all",
};

export default function ExploreClient() {
  const { isConnected } = useWalletStore();
  const [filters, setFilters] = useState<ExploreFilters>(DEFAULT_FILTERS);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [selectedNft, setSelectedNft] = useState<MockNFT | null>(null);

  // Featured NFTs (top 3 by prompt score)
  const featuredNFTs = useMemo(
    () =>
      [...mockNFTs]
        .sort((a, b) => (b.promptScore ?? 0) - (a.promptScore ?? 0))
        .slice(0, 3),
    []
  );

  // Filter & sort NFTs
  const filteredNFTs = useMemo(() => {
    let result = [...mockNFTs];

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (nft) =>
          nft.name.toLowerCase().includes(q) ||
          nft.collection?.toLowerCase().includes(q) ||
          nft.creator.bnsName.toLowerCase().includes(q) ||
          nft.prompt?.toLowerCase().includes(q)
      );
    }

    // Category
    if (filters.category) {
      result = result.filter((nft) => nft.category === filters.category);
    }

    // AI Model
    if (filters.aiModel) {
      result = result.filter((nft) => nft.aiModel === filters.aiModel);
    }

    // Sale type
    if (filters.saleType === "buy-now") {
      result = result.filter((nft) => !nft.isAuction);
    } else if (filters.saleType === "auction") {
      result = result.filter((nft) => nft.isAuction);
    }

    // Prompt tier
    if (filters.promptTier) {
      result = result.filter((nft) => {
        if (nft.promptScore == null) return false;
        const tier = getPromptTier(nft.promptScore);
        if (filters.promptTier === "rare") {
          // "Rare+" means rare and above
          return tier === "rare" || tier === "epic" || tier === "legendary";
        }
        return tier === filters.promptTier;
      });
    }

    // Sort
    switch (filters.sortBy) {
      case "price-low":
        result.sort((a, b) => a.priceStx - b.priceStx);
        break;
      case "price-high":
        result.sort((a, b) => b.priceStx - a.priceStx);
        break;
      case "prompt-score":
        result.sort((a, b) => (b.promptScore ?? 0) - (a.promptScore ?? 0));
        break;
      case "trending":
        result.sort((a, b) => b.likeCount - a.likeCount);
        break;
      // "recent" keeps original order
    }

    return result;
  }, [filters]);

  const handleBuy = async (nft: MockNFT) => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    setBuyingId(nft.id);
    try {
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

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Hero */}
      <ExploreHero
        featuredNFTs={featuredNFTs}
        stats={{
          totalNfts: 12847,
          totalVolume: 2450000,
          activeCreators: 1893,
        }}
      />

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">
          <span className="font-mono text-text-secondary">{filteredNFTs.length}</span> NFTs found
        </p>
      </div>

      {/* Grid */}
      <NFTGrid
        nfts={filteredNFTs}
        onBuy={handleBuy}
        onSelect={setSelectedNft}
        buyingId={buyingId}
      />

      {/* Detail Modal */}
      <NFTDetailModal
        nft={selectedNft}
        onClose={() => setSelectedNft(null)}
        onBuy={handleBuy}
        buying={buyingId === selectedNft?.id}
      />
    </div>
  );
}
