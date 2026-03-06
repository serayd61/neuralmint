"use client";

import { NFTCard } from "@/components/shared/NFTCard";
import { SkeletonCard } from "@/components/shared/SkeletonCard";
import type { MockNFT } from "@/lib/mock-data";

interface NFTGridProps {
  nfts: MockNFT[];
  loading?: boolean;
  onBuy: (nft: MockNFT) => void;
  onSelect: (nft: MockNFT) => void;
  buyingId: string | null;
}

export function NFTGrid({ nfts, loading, onBuy, onSelect, buyingId }: NFTGridProps) {
  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div
          className="mb-4 h-20 w-20 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.15)" }}
        >
          <span className="text-3xl">🔍</span>
        </div>
        <p className="text-lg font-semibold text-text-secondary">No NFTs found</p>
        <p className="mt-2 text-sm text-text-muted max-w-sm">
          Try adjusting your search or filters to discover more AI-generated artwork
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {nfts.map((nft) => (
        <NFTCard
          key={nft.id}
          nft={nft}
          onBuy={onBuy}
          onSelect={onSelect}
          buying={buyingId === nft.id}
        />
      ))}
    </div>
  );
}
