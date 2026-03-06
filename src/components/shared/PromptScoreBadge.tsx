"use client";

import { PROMPT_TIER_CONFIG, getPromptTier } from "@/lib/prompt-utils";

interface PromptScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function PromptScoreBadge({ score, size = "md", showLabel = false }: PromptScoreBadgeProps) {
  const tier = getPromptTier(score);
  const config = PROMPT_TIER_CONFIG[tier];

  const sizeConfig = {
    sm: { outer: 28, inner: 22, stroke: 2.5, fontSize: "8px", radius: 10 },
    md: { outer: 36, inner: 28, stroke: 3, fontSize: "10px", radius: 12 },
    lg: { outer: 48, inner: 38, stroke: 3.5, fontSize: "13px", radius: 16 },
  };
  const s = sizeConfig[size];
  const circumference = 2 * Math.PI * s.radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative" style={{ width: s.outer, height: s.outer }}>
        <svg width={s.outer} height={s.outer} className="rotate-[-90deg]">
          {/* Background ring */}
          <circle
            cx={s.outer / 2}
            cy={s.outer / 2}
            r={s.radius}
            fill="rgba(0,0,0,0.6)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={s.stroke}
          />
          {/* Progress ring */}
          <circle
            cx={s.outer / 2}
            cy={s.outer / 2}
            r={s.radius}
            fill="none"
            stroke={config.color}
            strokeWidth={s.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${config.glowColor})` }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-mono font-bold"
          style={{ fontSize: s.fontSize, color: config.color }}
        >
          {score}
        </span>
      </div>
      {showLabel && (
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={{
            background: config.bgColor,
            border: `1px solid ${config.borderColor}`,
            color: config.color,
          }}
        >
          {config.label}
        </span>
      )}
    </div>
  );
}
