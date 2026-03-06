"use client";

import { useRef, useCallback, useState } from "react";
import { Heart, Gavel, ShoppingCart, Loader2, ExternalLink } from "lucide-react";
import { PromptScoreBadge } from "./PromptScoreBadge";
import { AIModelBadge } from "./AIModelBadge";
import type { NFTItem } from "@/lib/types";
import Link from "next/link";

interface NFTCardProps {
  nft: NFTItem;
  onBuy?: (nft: NFTItem) => void;
  onSelect?: (nft: NFTItem) => void;
  buying?: boolean;
}

export function NFTCard({ nft, onBuy, onSelect, buying }: NFTCardProps) {
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
      onClick={() => onSelect?.(nft)}
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
          loading="lazy"
          className="h-52 w-full object-cover transition-transform duration-500"
          style={{ transform: hovered ? "scale(1.05)" : "scale(1)" }}
        />
        {/* AI Model Badge */}
        <div className="absolute left-2.5 top-2.5">
          <AIModelBadge model={nft.aiModel} />
        </div>
        {/* Prompt Score Badge */}
        {nft.promptScore != null && (
          <div className="absolute right-2.5 top-2.5">
            <PromptScoreBadge score={nft.promptScore} size="sm" />
          </div>
        )}
        {/* Auction timer */}
        {nft.isAuction && nft.blocksRemaining && (
          <div className="absolute right-2.5 bottom-2.5 rounded-full bg-black/70 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-mono text-neon-pink border border-neon-pink/20">
            ~{nft.blocksRemaining} blocks
          </div>
        )}
        {/* Favorite */}
        <button
          onClick={(e) => { e.stopPropagation(); }}
          className="absolute left-2.5 bottom-2.5 rounded-full bg-black/65 p-1.5 text-text-secondary hover:text-neon-pink transition-colors"
        >
          <Heart size={13} />
        </button>
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-transparent" />
      </div>

      <div className="p-4 space-y-2 relative" style={{ transform: "translateZ(20px)" }}>
        <p className="truncate text-[11px] text-text-muted font-medium">
          {nft.collection || "NeuralMint"}
        </p>
        <h3 className="truncate text-sm font-bold text-text-primary group-hover:text-neon-cyan transition-colors">
          {nft.name}
        </h3>
        <p className="truncate text-[11px] text-text-secondary">{nft.creator.bnsName}</p>
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-[10px] text-text-muted block">Price</span>
            <span className="font-mono text-sm font-bold text-neon-orange">
              {nft.priceStx.toFixed(2)} STX
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-text-muted block">Rarity</span>
            <span className="text-xs font-bold text-neon-purple">{nft.rarity}/100</span>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Link
            href={`/nft/${nft.tokenId}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[11px] text-text-secondary hover:text-neon-cyan hover:border-neon-cyan/30 transition-colors text-center"
          >
            <span className="inline-flex items-center justify-center gap-1">
              <ExternalLink size={11} />
              Details
            </span>
          </Link>
          {nft.isAuction ? (
            <button
              onClick={(e) => { e.stopPropagation(); }}
              className="flex-1 rounded-md border border-neon-purple/30 bg-neon-purple/10 px-2 py-1.5 text-[11px] text-neon-purple hover:bg-neon-purple/20 transition-colors"
            >
              <span className="inline-flex items-center justify-center gap-1">
                <Gavel size={12} />
                Place Bid
              </span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBuy?.(nft);
              }}
              disabled={buying}
              className="flex-1 rounded-md border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-1.5 text-[11px] text-neon-cyan hover:bg-neon-cyan/20 transition-colors disabled:opacity-50"
            >
              <span className="inline-flex items-center justify-center gap-1">
                {buying ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <ShoppingCart size={12} />
                )}
                {buying ? "Buying..." : "Buy Now"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
