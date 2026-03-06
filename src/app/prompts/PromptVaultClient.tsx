"use client";

import { useState, useMemo, useEffect } from "react";
import { Sparkles, Crown, Gem, Zap, Circle, Shield, Trophy, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { PROMPT_VAULT } from "@/lib/prompt-vault-data";
import { PROMPT_TIER_CONFIG, getPromptTier } from "@/lib/prompt-utils";
import { FilterChip } from "@/components/shared/FilterChip";
import { PromptVaultCard } from "./_components/PromptVaultCard";
import { PromptScoreBadge } from "@/components/shared/PromptScoreBadge";
import { RarityBadgeFromScore } from "@/components/rarity-badge";
import { NFT_CONTRACT_ADDRESS, NFT_CONTRACT_NAME, STACKS_API_URL } from "@/lib/constants";
import { getGatewayUrls } from "@/lib/ipfs";
import { truncateAddress } from "@/lib/utils";
import type { PromptTier } from "@/lib/types";

const TIER_ICONS = {
  legendary: Crown,
  epic: Gem,
  rare: Zap,
  uncommon: Shield,
  common: Circle,
};

interface LeaderboardEntry {
  rank: number;
  tokenId: number;
  name: string;
  prompt: string;
  score: number;
  imageUrl: string;
  aiModel: string;
  creator: string;
}

export default function PromptVaultPage() {
  const [activeTab, setActiveTab] = useState<"vault" | "leaderboard">("vault");
  const [filterTier, setFilterTier] = useState<PromptTier | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardSearch, setLeaderboardSearch] = useState("");
  const [leaderboardTierFilter, setLeaderboardTierFilter] = useState<PromptTier | null>(null);
  const [timeFilter, setTimeFilter] = useState<"week" | "month" | "all">("all");

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

  const tiers: PromptTier[] = ["legendary", "epic", "rare", "uncommon", "common"];

  const groupedByTier = useMemo(() => {
    const groups: Record<string, typeof filteredPrompts> = {};
    for (const tier of tiers) {
      const items = filteredPrompts.filter((p) => p.promptTier === tier);
      if (items.length > 0) groups[tier] = items;
    }
    return groups;
  }, [filteredPrompts]);

  // Fetch leaderboard from on-chain data
  useEffect(() => {
    if (activeTab !== "leaderboard") return;
    if (leaderboard.length > 0) return; // Already loaded

    setLeaderboardLoading(true);
    (async () => {
      try {
        const collectionsRes = await fetch("/api/collections");
        if (!collectionsRes.ok) { setLeaderboardLoading(false); return; }
        const colData = await collectionsRes.json();
        const totalMinted = colData.collections?.[0]?.totalMinted || 0;
        if (totalMinted === 0) { setLeaderboardLoading(false); return; }

        const entries: LeaderboardEntry[] = [];
        const startId = Math.max(1, totalMinted - 19);

        for (let id = totalMinted; id >= startId; id--) {
          try {
            const hexTokenId = "01" + id.toString(16).padStart(32, "0");
            const res = await fetch(
              `${STACKS_API_URL}/v2/contracts/call-read/${NFT_CONTRACT_ADDRESS}/${NFT_CONTRACT_NAME}/get-token-uri`,
              { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sender: NFT_CONTRACT_ADDRESS, arguments: [`0x${hexTokenId}`] }) }
            );
            if (!res.ok) continue;
            const data = await res.json();
            const hex = data.result?.slice(2) || "";
            if (!hex.startsWith("070a0d")) continue;
            const length = parseInt(hex.slice(6, 14), 16);
            const strHex = hex.slice(14, 14 + length * 2);
            const bytes = new Uint8Array(strHex.match(/.{2}/g)!.map((b: string) => parseInt(b, 16)));
            const uri = new TextDecoder().decode(bytes);
            const metaUrl = uri.startsWith("ipfs://") ? `https://cloudflare-ipfs.com/ipfs/${uri.slice(7)}` : uri;
            const metaRes = await fetch(metaUrl, { signal: AbortSignal.timeout(10000) });
            if (!metaRes.ok) continue;
            const metadata = await metaRes.json();
            const prompt = metadata.properties?.prompt || "";
            const score = metadata.properties?.prompt_score || 0;
            const imageUrl = metadata.image ? (getGatewayUrls(metadata.image)[0] || "") : "";
            const aiModel = metadata.attributes?.find((a: any) => a.trait_type === "AI Model")?.value || "";
            entries.push({
              rank: 0,
              tokenId: id,
              name: metadata.name || `NeuralMint #${id}`,
              prompt,
              score,
              imageUrl,
              aiModel,
              creator: NFT_CONTRACT_ADDRESS,
            });
          } catch {}
        }

        // Sort by score descending and assign ranks
        entries.sort((a, b) => b.score - a.score);
        entries.forEach((e, i) => (e.rank = i + 1));
        setLeaderboard(entries);
      } catch {}
      setLeaderboardLoading(false);
    })();
  }, [activeTab, leaderboard.length]);

  const filteredLeaderboard = useMemo(() => {
    let result = [...leaderboard];
    if (leaderboardSearch) {
      const q = leaderboardSearch.toLowerCase();
      result = result.filter(
        (e) => e.name.toLowerCase().includes(q) || e.prompt.toLowerCase().includes(q)
      );
    }
    if (leaderboardTierFilter) {
      result = result.filter((e) => getPromptTier(e.score) === leaderboardTierFilter);
    }
    return result;
  }, [leaderboard, leaderboardSearch, leaderboardTierFilter]);

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
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("vault")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "vault"
                ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/30"
                : "bg-bg-card text-text-muted border border-white/10 hover:text-text-secondary"
            }`}
          >
            <Sparkles size={14} />
            Curated Prompts
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "leaderboard"
                ? "bg-neon-orange/20 text-neon-orange border border-neon-orange/30"
                : "bg-bg-card text-text-muted border border-white/10 hover:text-text-secondary"
            }`}
          >
            <Trophy size={14} />
            Leaderboard
          </button>
        </div>

        {/* Stats (vault only) */}
        {activeTab === "vault" && (
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
        )}
      </header>

      {/* ═══ VAULT TAB ═══ */}
      {activeTab === "vault" && (
        <>
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
                    <h2 className="text-base font-bold text-text-primary">{config.label} Prompts</h2>
                    <p className="text-[11px] text-text-muted">Score {config.min}+ — {items.length} prompt{items.length !== 1 && "s"}</p>
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
        </>
      )}

      {/* ═══ LEADERBOARD TAB ═══ */}
      {activeTab === "leaderboard" && (
        <>
          {/* Leaderboard filters */}
          <section className="glass rounded-xl border border-white/10 p-4 space-y-3">
            {/* Time filter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-muted mr-1">Period:</span>
              {([["week", "This Week"], ["month", "This Month"], ["all", "All Time"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTimeFilter(key)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                    timeFilter === key
                      ? "bg-neon-orange/15 text-neon-orange border border-neon-orange/25"
                      : "text-text-muted hover:text-text-secondary hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="relative block">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={leaderboardSearch}
                  onChange={(e) => setLeaderboardSearch(e.target.value)}
                  placeholder="Search prompts..."
                  className="w-full rounded-lg border border-white/10 bg-bg-card pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-cyan/50 focus:outline-none"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {tiers.map((tier) => (
                  <FilterChip
                    key={tier}
                    label={PROMPT_TIER_CONFIG[tier].label}
                    active={leaderboardTierFilter === tier}
                    onClick={() => setLeaderboardTierFilter(leaderboardTierFilter === tier ? null : tier)}
                  />
                ))}
              </div>
            </div>
          </section>

          {leaderboardLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-neon-cyan" />
            </div>
          ) : filteredLeaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 py-24 text-center">
              <Trophy size={32} className="text-neon-orange/30 mb-4" />
              <h3 className="text-lg font-semibold text-white">No minted prompts yet</h3>
              <p className="mt-2 max-w-md text-sm text-white/40">
                Be the first to write a Legendary prompt and mint it as an NFT!
              </p>
              <Link
                href="/create"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple px-6 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-neon-cyan/20 transition-all"
              >
                <Sparkles size={16} />
                Write Your Legendary Prompt
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLeaderboard.map((entry) => {
                const tier = getPromptTier(entry.score);
                const tierConfig = PROMPT_TIER_CONFIG[tier];
                const isTop3 = entry.rank <= 3;
                const medalColors = ["", "linear-gradient(135deg, #FACC15, #F97316)", "linear-gradient(135deg, #94A3B8, #CBD5E1)", "linear-gradient(135deg, #B45309, #D97706)"];

                return (
                  <div
                    key={entry.tokenId}
                    className="neon-card flex items-center gap-4 p-4 group"
                    style={{
                      background: tierConfig.bgColor,
                      borderColor: isTop3 ? tierConfig.borderColor : undefined,
                      ...(tier === "legendary" ? { boxShadow: `0 0 20px ${tierConfig.color}15` } : {}),
                    }}
                  >
                    {/* Rank */}
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black"
                      style={isTop3 ? {
                        background: medalColors[entry.rank],
                        color: entry.rank <= 2 ? "#000" : "#FFF",
                        border: "2px solid rgba(255,255,255,0.1)",
                      } : {
                        background: "rgba(255,255,255,0.05)",
                        color: "rgba(255,255,255,0.4)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      #{entry.rank}
                    </div>

                    {/* Thumbnail */}
                    {entry.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.imageUrl}
                        alt={entry.name}
                        className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="h-14 w-14 shrink-0 rounded-xl bg-white/[0.03] flex items-center justify-center">
                        <Sparkles size={16} className="text-white/10" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-text-primary truncate group-hover:text-neon-cyan transition-colors">
                          {entry.name}
                        </p>
                        <span className="text-[9px] text-text-muted font-mono shrink-0">#{entry.tokenId}</span>
                      </div>
                      <p className="text-[11px] text-text-muted truncate leading-relaxed">
                        {entry.prompt ? entry.prompt.slice(0, 100) + (entry.prompt.length > 100 ? "..." : "") : "Hidden prompt"}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[9px] text-text-muted">{truncateAddress(entry.creator)}</span>
                        {entry.aiModel && (
                          <span className="text-[9px] text-neon-cyan/60 bg-neon-cyan/10 rounded px-1.5 py-0.5">
                            {entry.aiModel.toLowerCase().includes("dall") ? "DALL-E 3" : "SD"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score + Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <PromptScoreBadge score={entry.score} size="lg" showLabel />
                      </div>
                      <RarityBadgeFromScore score={entry.score} size="sm" />
                      <Link
                        href={`/create?prompt=${encodeURIComponent(entry.prompt)}`}
                        className="rounded-lg border border-neon-purple/30 bg-neon-purple/10 px-2.5 py-1.5 text-[10px] text-neon-purple hover:bg-neon-purple/20 transition-colors shrink-0"
                      >
                        <Sparkles size={10} className="inline mr-1" />
                        Inspire
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
