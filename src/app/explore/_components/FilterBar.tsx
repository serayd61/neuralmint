"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { FilterChip } from "@/components/shared/FilterChip";
import { PROMPT_CATEGORIES } from "@/lib/prompt-utils";
import type { ExploreFilters } from "@/lib/types";

interface FilterBarProps {
  filters: ExploreFilters;
  onChange: (filters: ExploreFilters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = <K extends keyof ExploreFilters>(key: K, value: ExploreFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const activeFilterCount = [
    filters.category,
    filters.aiModel,
    filters.promptTier,
    filters.saleType !== "all" ? filters.saleType : null,
  ].filter(Boolean).length;

  return (
    <section className="glass rounded-xl border border-white/10 p-4 space-y-3">
      {/* Main row */}
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="Search NFTs, collections, creators..."
            className="w-full rounded-lg border border-white/10 bg-bg-card pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-cyan/50 focus:outline-none"
          />
        </label>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs transition-all ${
            showAdvanced || activeFilterCount > 0
              ? "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan"
              : "border-white/10 bg-bg-card text-text-secondary hover:text-neon-cyan"
          }`}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-neon-cyan/20 px-1.5 text-[10px] font-bold">{activeFilterCount}</span>
          )}
        </button>
        <select
          value={filters.sortBy}
          onChange={(e) => updateFilter("sortBy", e.target.value as ExploreFilters["sortBy"])}
          className="rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-xs text-text-secondary focus:border-neon-cyan/50 focus:outline-none"
        >
          <option value="trending">Trending</option>
          <option value="prompt-score">Prompt Score</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="recent">Recently Listed</option>
        </select>
        <button
          onClick={() =>
            onChange({
              search: "",
              category: null,
              aiModel: null,
              priceRange: [0, 10000],
              promptScoreRange: [0, 100],
              promptTier: null,
              sortBy: "trending",
              saleType: "all",
            })
          }
          className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-2.5 text-xs text-neon-cyan hover:bg-neon-cyan/20 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Quick filter chips */}
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="Buy Now"
          active={filters.saleType === "buy-now"}
          onClick={() => updateFilter("saleType", filters.saleType === "buy-now" ? "all" : "buy-now")}
        />
        <FilterChip
          label="On Auction"
          active={filters.saleType === "auction"}
          onClick={() => updateFilter("saleType", filters.saleType === "auction" ? "all" : "auction")}
        />
        <FilterChip
          label="DALL·E 3"
          active={filters.aiModel === "dall-e-3"}
          onClick={() => updateFilter("aiModel", filters.aiModel === "dall-e-3" ? null : "dall-e-3")}
        />
        <FilterChip
          label="Legendary"
          active={filters.promptTier === "legendary"}
          onClick={() => updateFilter("promptTier", filters.promptTier === "legendary" ? null : "legendary")}
        />
        <FilterChip
          label="Epic"
          active={filters.promptTier === "epic"}
          onClick={() => updateFilter("promptTier", filters.promptTier === "epic" ? null : "epic")}
        />
        <FilterChip
          label="Rare+"
          active={filters.promptTier === "rare"}
          onClick={() => updateFilter("promptTier", filters.promptTier === "rare" ? null : "rare")}
        />
      </div>

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="border-t border-white/10 pt-3 space-y-3">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Categories */}
            <div>
              <p className="mb-2 text-[11px] font-semibold text-text-muted uppercase tracking-wide">Category</p>
              <div className="flex flex-wrap gap-1.5">
                {PROMPT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => updateFilter("category", filters.category === cat ? null : cat)}
                    className={`rounded-md px-2 py-1 text-[10px] transition-all ${
                      filters.category === cat
                        ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/30"
                        : "bg-bg-card text-text-muted border border-white/5 hover:border-white/20"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Model */}
            <div>
              <p className="mb-2 text-[11px] font-semibold text-text-muted uppercase tracking-wide">AI Model</p>
              <div className="flex flex-wrap gap-1.5">
                {["dall-e-3", "stable-diffusion"].map((model) => (
                  <button
                    key={model}
                    onClick={() => updateFilter("aiModel", filters.aiModel === model ? null : model)}
                    className={`rounded-md px-2 py-1 text-[10px] transition-all ${
                      filters.aiModel === model
                        ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30"
                        : "bg-bg-card text-text-muted border border-white/5 hover:border-white/20"
                    }`}
                  >
                    {model === "dall-e-3" ? "DALL·E 3" : "Stable Diffusion"}
                  </button>
                ))}
              </div>
            </div>

            {/* Sale Type */}
            <div>
              <p className="mb-2 text-[11px] font-semibold text-text-muted uppercase tracking-wide">Sale Type</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: "all", label: "All" },
                  { value: "buy-now", label: "Buy Now" },
                  { value: "auction", label: "Auction" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateFilter("saleType", opt.value as ExploreFilters["saleType"])}
                    className={`rounded-md px-2 py-1 text-[10px] transition-all ${
                      filters.saleType === opt.value
                        ? "bg-neon-orange/20 text-neon-orange border border-neon-orange/30"
                        : "bg-bg-card text-text-muted border border-white/5 hover:border-white/20"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAdvanced(false)}
            className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary"
          >
            <X size={12} /> Close filters
          </button>
        </div>
      )}
    </section>
  );
}
