// ============================================
// NeuralMint — Prompt Tier Utilities
// ============================================

import type { PromptTier } from "./types";

export function getPromptTier(score: number): PromptTier {
  if (score >= 81) return "legendary";
  if (score >= 61) return "epic";
  if (score >= 41) return "rare";
  if (score >= 21) return "uncommon";
  return "common";
}

export const PROMPT_TIER_CONFIG = {
  legendary: {
    label: "Legendary",
    color: "#FFE600",
    bgColor: "rgba(255,230,0,0.1)",
    borderColor: "rgba(255,230,0,0.3)",
    glowColor: "rgba(255,230,0,0.15)",
    min: 81,
  },
  epic: {
    label: "Epic",
    color: "#A855F7",
    bgColor: "rgba(168,85,247,0.1)",
    borderColor: "rgba(168,85,247,0.3)",
    glowColor: "rgba(168,85,247,0.15)",
    min: 61,
  },
  rare: {
    label: "Rare",
    color: "#00E5FF",
    bgColor: "rgba(0,229,255,0.1)",
    borderColor: "rgba(0,229,255,0.3)",
    glowColor: "rgba(0,229,255,0.15)",
    min: 41,
  },
  uncommon: {
    label: "Uncommon",
    color: "#22C55E",
    bgColor: "rgba(34,197,94,0.1)",
    borderColor: "rgba(34,197,94,0.3)",
    glowColor: "rgba(34,197,94,0.15)",
    min: 21,
  },
  common: {
    label: "Common",
    color: "#6B7280",
    bgColor: "rgba(107,114,128,0.1)",
    borderColor: "rgba(107,114,128,0.3)",
    glowColor: "rgba(107,114,128,0.15)",
    min: 0,
  },
} as const;

export function getSuggestedMintPrice(promptScore: number): number {
  if (promptScore >= 81) return 500;
  if (promptScore >= 61) return 250;
  if (promptScore >= 41) return 100;
  if (promptScore >= 21) return 50;
  return 25;
}

export const PROMPT_CATEGORIES = [
  "Art",
  "Abstract",
  "PFP",
  "Photography",
  "Gaming",
  "Fantasy",
  "Sci-Fi",
  "Nature",
  "Portrait",
  "Surreal",
] as const;

export type PromptCategory = (typeof PROMPT_CATEGORIES)[number];
