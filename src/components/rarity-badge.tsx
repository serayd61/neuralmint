"use client";

import { PROMPT_TIER_CONFIG, getPromptTier } from "@/lib/prompt-utils";
import type { PromptTier } from "@/lib/types";

interface RarityBadgeProps {
  tier: PromptTier;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function RarityBadge({ tier, size = "md", showLabel = true }: RarityBadgeProps) {
  const config = PROMPT_TIER_CONFIG[tier];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[9px] gap-1",
    md: "px-2.5 py-1 text-[11px] gap-1.5",
    lg: "px-3 py-1.5 text-xs gap-2",
  };

  const dotSize = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  };

  const isLegendary = tier === "legendary";

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wide ${sizeClasses[size]} ${
        isLegendary ? "legendary-shimmer" : ""
      }`}
      style={{
        background: isLegendary
          ? "linear-gradient(135deg, rgba(255,230,0,0.15), rgba(255,180,0,0.15))"
          : config.bgColor,
        border: `1px solid ${config.borderColor}`,
        color: config.color,
        boxShadow: `0 0 8px ${config.glowColor}`,
      }}
    >
      <span
        className={`rounded-full ${dotSize[size]}`}
        style={{
          background: config.color,
          boxShadow: `0 0 6px ${config.color}`,
        }}
      />
      {showLabel && config.label}

      {isLegendary && (
        <style jsx>{`
          .legendary-shimmer {
            position: relative;
            overflow: hidden;
          }
          .legendary-shimmer::after {
            content: "";
            position: absolute;
            top: -50%;
            left: -50%;
            right: -50%;
            bottom: -50%;
            background: linear-gradient(
              45deg,
              transparent 30%,
              rgba(255, 230, 0, 0.15) 45%,
              rgba(255, 230, 0, 0.25) 50%,
              rgba(255, 230, 0, 0.15) 55%,
              transparent 70%
            );
            animation: shimmer-slide 3s ease-in-out infinite;
          }
          @keyframes shimmer-slide {
            0% { transform: translateX(-100%) rotate(45deg); }
            100% { transform: translateX(100%) rotate(45deg); }
          }
        `}</style>
      )}
    </span>
  );
}

/** Convenience: accepts score number instead of tier */
export function RarityBadgeFromScore({
  score,
  ...props
}: Omit<RarityBadgeProps, "tier"> & { score: number }) {
  return <RarityBadge tier={getPromptTier(score)} {...props} />;
}
