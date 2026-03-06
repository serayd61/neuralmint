"use client";

import { useState, useMemo } from "react";
import { Sparkles, Crown, Gem, Zap, Circle } from "lucide-react";
import { PROMPT_VAULT } from "@/lib/prompt-vault-data";
import { PROMPT_TIER_CONFIG } from "@/lib/prompt-utils";
import { FilterChip } from "@/components/shared/FilterChip";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { PromptVaultCard } from "./_components/PromptVaultCard";
import type { PromptTier } from "@/lib/types";

const TIER_ICONS = {
  legendary: Crown,
  epic: Gem,
  rare: Zap,
  common: Circle,
};

export default function PromptVaultPage() {
  const [filterTier, setFilterTier] = useState<PromptTier | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set(PROMPT_VAULT.map((p) => p.category))],
    []
  );

  const filteredPrompts = useMemo(() => {
    let result = [...PROMPT_VAULT];
    if (filterTier) result = result.filter((p) => p.promptTier === filterTier);
    if (filterCategory) result = result.filter((p) => p.category === filterCategory);
    return result.sort((a, b) => b.promptScore - a.promptScore);
  }, [filterTier, filterCategory]);

  const tiers: PromptTier[] = ["legendary", "epic", "rare", "common"];

  const groupedByTier = useMemo(() => {
    const groups: Record<string, typeof filteredPrompts> = {};
    for (const tier of tiers) {
      const items = filteredPrompts.filter((p) => p.promptTier === tier);
      if (items.length > 0) groups[tier] = items;
    }
    return groups;
  }, [filteredPrompts]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Curated Collection</p>
          <h1 className="font-heading text-3xl font-bold">
            <span
              style={{
                background: "linear-gradient(135deg, #FFE600, #A855F7, #00E5FF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Prompt Vault
            </span>
          </h1>
          <p className="mt-2 text-sm text-text-secondary max-w-lg">
            Premium AI prompts curated by NeuralMint experts. The best prompts create the most valuable NFTs.
            Select a prompt and start minting instantly.
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-3">
          {tiers.map((tier) => {
            const config = PROMPT_TIER_CONFIG[tier];
            const Icon = TIER_ICONS[tier];
            const count = PROMPT_VAULT.filter((p) => p.promptTier === tier).length;
            return (
              <div
                key={tier}
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: config.bgColor, border: `1px solid ${config.borderColor}` }}
              >
                <Icon size={14} style={{ color: config.color }} />
                <span className="text-xs font-semibold" style={{ color: config.color }}>
                  {count} {config.label}
                </span>
              </div>
            );
          })}
        </div>
      </header>

      {/* Filters */}
      <section className="glass rounded-xl border border-white/10 p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] text-text-muted self-center mr-1">Tier:</span>
          {tiers.map((tier) => (
            <FilterChip
              key={tier}
              label={PROMPT_TIER_CONFIG[tier].label}
              active={filterTier === tier}
              onClick={() => setFilterTier(filterTier === tier ? null : tier)}
            />
          ))}
          <span className="text-white/10 self-center">|</span>
          <span className="text-[11px] text-text-muted self-center mr-1">Category:</span>
          {categories.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              active={filterCategory === cat}
              onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
            />
          ))}
        </div>
        <p className="text-[11px] text-text-muted">
          Showing <span className="font-mono text-text-secondary">{filteredPrompts.length}</span> prompts
        </p>
      </section>

      {/* Grouped prompts */}
      {Object.entries(groupedByTier).map(([tier, items]) => {
        const config = PROMPT_TIER_CONFIG[tier as PromptTier];
        const Icon = TIER_ICONS[tier as PromptTier];
        return (
          <section key={tier} className="space-y-5">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: config.bgColor, border: `1px solid ${config.borderColor}` }}
              >
                <Icon size={16} style={{ color: config.color }} />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary">
                  {config.label} Prompts
                </h2>
                <p className="text-[11px] text-text-muted">
                  Score {config.min}+ — {items.length} prompt{items.length !== 1 && "s"}
                </p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <PromptVaultCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}

      {filteredPrompts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Sparkles size={32} className="text-text-muted mb-4" />
          <p className="text-lg font-semibold text-text-secondary">No prompts match your filters</p>
          <p className="mt-2 text-sm text-text-muted">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
