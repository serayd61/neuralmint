// ============================================
// NeuralMint — Prompt Tier Utilities
// ============================================

import type { PromptTier } from "./types";

export function getPromptTier(score: number): PromptTier {
  if (score >= 95) return "legendary";
  if (score >= 85) return "epic";
  if (score >= 70) return "rare";
  return "common";
}

export const PROMPT_TIER_CONFIG = {
  legendary: {
    label: "Legendary",
    color: "#FFE600",
    bgColor: "rgba(255,230,0,0.1)",
    borderColor: "rgba(255,230,0,0.3)",
    glowColor: "rgba(255,230,0,0.15)",
    min: 95,
  },
  epic: {
    label: "Epic",
    color: "#A855F7",
    bgColor: "rgba(168,85,247,0.1)",
    borderColor: "rgba(168,85,247,0.3)",
    glowColor: "rgba(168,85,247,0.15)",
    min: 85,
  },
  rare: {
    label: "Rare",
    color: "#00E5FF",
    bgColor: "rgba(0,229,255,0.1)",
    borderColor: "rgba(0,229,255,0.3)",
    glowColor: "rgba(0,229,255,0.15)",
    min: 70,
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
  if (promptScore >= 95) return 500;
  if (promptScore >= 85) return 250;
  if (promptScore >= 70) return 100;
  return 50;
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
