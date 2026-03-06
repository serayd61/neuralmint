"use client";

import { useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, ExternalLink, Sparkles, ShoppingCart, Gavel, Loader2, ArrowRight } from "lucide-react";
import { PromptScoreBadge } from "@/components/shared/PromptScoreBadge";
import { AIModelBadge } from "@/components/shared/AIModelBadge";
import { PROMPT_TIER_CONFIG, getPromptTier } from "@/lib/prompt-utils";
import { scorePrompt } from "@/lib/prompt-scoring";
import type { MockNFT } from "@/lib/mock-data";
import Link from "next/link";

interface NFTDetailModalProps {
  nft: MockNFT | null;
  onClose: () => void;
  onBuy?: (nft: MockNFT) => void;
  buying?: boolean;
}

export function NFTDetailModal({ nft, onClose, onBuy, buying }: NFTDetailModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    if (nft) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown, nft]);

  const scoreBreakdown = nft?.prompt ? scorePrompt(nft.prompt, nft.aiModel) : null;
  const tier = nft?.promptScore != null ? getPromptTier(nft.promptScore) : "common";
  const tierConfig = PROMPT_TIER_CONFIG[tier];

  const copyPrompt = () => {
    if (nft?.prompt) navigator.clipboard.writeText(nft.prompt);
  };

  return (
    <AnimatePresence>
      {nft && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10"
            style={{
              background: "linear-gradient(180deg, rgba(15,15,36,0.98), rgba(10,10,26,0.99))",
              boxShadow: "0 0 80px rgba(0,229,255,0.1), 0 40px 80px rgba(0,0,0,0.6)",
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-text-muted hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="grid lg:grid-cols-2">
              {/* Left: Image */}
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={nft.imageUrl}
                  alt={nft.name}
                  className="h-72 w-full object-cover lg:h-full lg:min-h-[500px]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0a1a]/50 hidden lg:block" />
                <div className="absolute left-3 top-3">
                  <AIModelBadge model={nft.aiModel} />
                </div>
              </div>

              {/* Right: Details */}
              <div className="p-6 space-y-5">
                {/* Header */}
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted font-semibold">
                    {nft.collection || "NeuralMint"}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-text-primary">{nft.name}</h2>
                  <p className="mt-1 text-xs text-text-secondary">by {nft.creator.bnsName}</p>
                </div>

                {/* Prompt Score */}
                {nft.promptScore != null && (
                  <div
                    className="rounded-xl p-4 space-y-3"
                    style={{ background: tierConfig.bgColor, border: `1px solid ${tierConfig.borderColor}` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text-primary">Prompt Score</span>
                      <PromptScoreBadge score={nft.promptScore} size="lg" showLabel />
                    </div>
                    {scoreBreakdown && (
                      <div className="grid grid-cols-2 gap-2">
                        <ScoreDimension label="Specificity" value={scoreBreakdown.specificity} max={25} />
                        <ScoreDimension label="Technical" value={scoreBreakdown.technicalQuality} max={25} />
                        <ScoreDimension label="Creativity" value={scoreBreakdown.creativity} max={25} />
                        <ScoreDimension label="Artistic" value={scoreBreakdown.artisticDirection} max={25} />
                      </div>
                    )}
                  </div>
                )}

                {/* Prompt */}
                {nft.prompt && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text-primary">Prompt Used</span>
                      <div className="flex gap-2">
                        <button
                          onClick={copyPrompt}
                          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-bg-card px-2 py-1 text-[10px] text-text-muted hover:text-neon-cyan hover:border-neon-cyan/30 transition-colors"
                        >
                          <Copy size={10} /> Copy
                        </button>
                        <Link
                          href={`/create?prompt=${encodeURIComponent(nft.prompt)}&model=${nft.aiModel}`}
                          className="inline-flex items-center gap-1 rounded-md border border-neon-purple/30 bg-neon-purple/10 px-2 py-1 text-[10px] text-neon-purple hover:bg-neon-purple/20 transition-colors"
                        >
                          <Sparkles size={10} /> Use Prompt
                        </Link>
                      </div>
                    </div>
                    <p className="rounded-lg bg-black/40 border border-white/5 p-3 text-xs text-text-secondary leading-relaxed font-mono">
                      {nft.prompt}
                    </p>
                  </div>
                )}

                {/* Price & Buy */}
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-text-muted uppercase">
                        {nft.isAuction ? "Current Bid" : "Price"}
                      </p>
                      <p className="font-mono text-xl font-bold text-neon-orange">
                        {nft.isAuction && nft.currentBidStx
                          ? `${nft.currentBidStx.toFixed(2)} STX`
                          : `${nft.priceStx.toFixed(2)} STX`}
                      </p>
                      <p className="text-[11px] text-text-muted">~${nft.usdEquivalent.toFixed(2)} USD</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-text-muted uppercase">Rarity</p>
                      <p className="text-lg font-bold text-neon-purple">{nft.rarity}/100</p>
                    </div>
                  </div>

                  {nft.isAuction ? (
                    <button className="w-full rounded-lg border border-neon-purple/30 bg-neon-purple/10 px-4 py-2.5 text-sm font-medium text-neon-purple hover:bg-neon-purple/20 transition-colors">
                      <span className="inline-flex items-center gap-2">
                        <Gavel size={16} /> Place Bid
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onBuy?.(nft)}
                      disabled={buying}
                      className="btn-primary w-full gap-2 text-sm disabled:opacity-50"
                    >
                      {buying ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ShoppingCart size={16} />
                      )}
                      {buying ? "Processing..." : "Buy Now"}
                    </button>
                  )}
                </div>

                {/* Create similar CTA */}
                <Link
                  href="/create"
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2.5 text-xs text-text-secondary hover:text-neon-cyan hover:border-neon-cyan/30 transition-colors"
                >
                  <Sparkles size={14} />
                  Create Similar NFT in AI Studio
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ScoreDimension({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-text-muted">{label}</span>
        <span className="text-[10px] font-mono text-text-secondary">{value}/{max}</span>
      </div>
      <div className="h-1 rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: pct >= 80 ? "#FFE600" : pct >= 60 ? "#A855F7" : pct >= 40 ? "#00E5FF" : "#6B7280",
          }}
        />
      </div>
    </div>
  );
}
