// ============================================
// NeuralMint — Shared TypeScript Types
// ============================================

// ── Prompt Tiers ──
export type PromptTier = "legendary" | "epic" | "rare" | "uncommon" | "common";

// ── AI Prompt Score (server-side GPT-4o-mini) ──
export interface AIPromptScore {
  score: number;
  breakdown: {
    originality: number;
    creativity: number;
    technical: number;
    market: number;
  };
  feedback: string;
  rarity_tier: PromptTier;
  suggestions: string[];
  promptHash: string;
}

// ── On-Chain Data ──
export interface OnChainData {
  txId: string;
  blockHeight: number;
  contractId: string;
  promptHash: string;
  mintedAt: string;
}

// ── NFT Item (primary NFT type used across the app) ──
export interface NFTItem {
  id: string;
  tokenId: number;
  name: string;
  imageUrl: string;
  creator: { address: string; bnsName: string; avatarUrl: string };
  owner: { address: string; bnsName: string };
  priceStx: number;
  usdEquivalent: number;
  aiModel: "dall-e-3" | "stable-diffusion";
  prompt?: string;
  promptScore?: number;
  promptTier?: PromptTier;
  rarity: number;
  likeCount: number;
  isLiked: boolean;
  category: string;
  collection?: string;
  isAuction: boolean;
  blocksRemaining?: number;
  currentBidStx?: number;
  onChainData?: OnChainData;
}

// ── Explore Filters ──
export interface ExploreFilters {
  search: string;
  category: string | null;
  aiModel: string | null;
  priceRange: [number, number];
  promptScoreRange: [number, number];
  promptTier: PromptTier | null;
  sortBy: "trending" | "price-low" | "price-high" | "prompt-score" | "recent";
  saleType: "all" | "buy-now" | "auction";
}

export const DEFAULT_EXPLORE_FILTERS: ExploreFilters = {
  search: "",
  category: null,
  aiModel: null,
  priceRange: [0, 10000],
  promptScoreRange: [0, 100],
  promptTier: null,
  sortBy: "trending",
  saleType: "all",
};

// ── Prompt Vault ──
export interface PromptVaultItem {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "master";
  promptScore: number;
  promptTier: PromptTier;
  exampleImageUrl: string;
  aiModel: "dall-e-3" | "stable-diffusion";
  usageCount: number;
  tags: string[];
}

// ── Prompt Bot Chat ──
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  suggestions?: PromptSuggestion[];
}

export interface PromptSuggestion {
  prompt: string;
  score: number;
  tier: PromptTier;
  improvements: string[];
}

// ── Prompt Scoring ──
export interface PromptScoreBreakdown {
  overall: number;
  specificity: number;
  technicalQuality: number;
  creativity: number;
  artisticDirection: number;
  tier: PromptTier;
}

// ── API Responses ──
export interface ExploreAPIResponse {
  nfts: NFTItem[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface PromptBotResponse {
  reply: string;
  suggestions: PromptSuggestion[];
}
