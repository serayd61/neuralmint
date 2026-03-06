"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PROMPT_TIER_CONFIG, getPromptTier } from "@/lib/prompt-utils";
import { RarityBadge } from "./rarity-badge";
import type { AIPromptScore } from "@/lib/types";

interface PromptScoreProps {
  data: AIPromptScore;
}

export function PromptScore({ data }: PromptScoreProps) {
  const tier = getPromptTier(data.score);
  const config = PROMPT_TIER_CONFIG[tier];

  const categories = [
    { label: "Originality", value: data.breakdown.originality, max: 25 },
    { label: "Creativity", value: data.breakdown.creativity, max: 25 },
    { label: "Technical", value: data.breakdown.technical, max: 25 },
    { label: "Market", value: data.breakdown.market, max: 25 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
      className="rounded-xl border p-4 space-y-4"
      style={{
        background: `linear-gradient(135deg, ${config.bgColor}, rgba(0,0,0,0.3))`,
        borderColor: config.borderColor,
      }}
    >
      {/* Header: Score circle + tier */}
      <div className="flex items-center gap-4">
        <CircularScore score={data.score} color={config.color} glowColor={config.glowColor} />
        <div className="flex-1">
          <RarityBadge tier={tier} size="md" />
          <p className="mt-1.5 text-[11px] text-white/40">
            Prompt Score
          </p>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.label}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-white/50">{cat.label}</span>
              <span className="font-mono text-white/70">{cat.value}/{cat.max}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(cat.value / cat.max) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.2, 0, 0, 1] }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${config.color}80, ${config.color})`,
                  boxShadow: `0 0 8px ${config.glowColor}`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Feedback */}
      {data.feedback && (
        <p className="text-[11px] leading-relaxed text-white/50 border-t border-white/[0.06] pt-3">
          {data.feedback}
        </p>
      )}

      {/* Suggestions */}
      {data.suggestions && data.suggestions.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
            Suggestions
          </p>
          {data.suggestions.map((s, i) => (
            <p key={i} className="text-[11px] text-white/40 flex items-start gap-1.5">
              <span className="text-white/20 mt-0.5">•</span>
              {s}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/** Animated circular score gauge */
function CircularScore({
  score,
  color,
  glowColor,
}: {
  score: number;
  color: string;
  glowColor: string;
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const size = 64;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 800;

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedScore(Math.round(score * eased));
      if (t < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="rgba(0,0,0,0.4)"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 6px ${glowColor})`,
            transition: "stroke-dashoffset 0.1s ease-out",
          }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-mono text-lg font-bold"
        style={{ color }}
      >
        {animatedScore}
      </span>
    </div>
  );
}
