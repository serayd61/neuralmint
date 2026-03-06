"use client";

import { useRef, useCallback, useState } from "react";
import { Sparkles, Copy, Users, ArrowRight } from "lucide-react";
import { PromptScoreBadge } from "@/components/shared/PromptScoreBadge";
import { AIModelBadge } from "@/components/shared/AIModelBadge";
import { PROMPT_TIER_CONFIG } from "@/lib/prompt-utils";
import type { PromptVaultItem } from "@/lib/types";
import Link from "next/link";

interface PromptVaultCardProps {
  item: PromptVaultItem;
}

export function PromptVaultCard({ item }: PromptVaultCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const tierConfig = PROMPT_TIER_CONFIG[item.promptTier];

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const tiltX = (0.5 - y) * 6;
    const tiltY = (x - 0.5) * 6;
    ref.current.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(5px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
    setHovered(false);
  }, []);

  const copyPrompt = () => {
    navigator.clipboard.writeText(item.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const difficultyColors = {
    beginner: "text-neon-green",
    intermediate: "text-neon-cyan",
    advanced: "text-neon-purple",
    master: "text-neon-pink",
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="neon-card holo-shine overflow-hidden group"
      style={{
        transition: "transform 0.35s cubic-bezier(0.2, 0, 0, 1), border-color 0.35s, box-shadow 0.35s",
        transformStyle: "preserve-3d",
        willChange: "transform",
        borderColor: hovered ? tierConfig.borderColor : undefined,
        boxShadow: hovered ? `0 0 30px ${tierConfig.glowColor}` : undefined,
      }}
    >
      {/* Image */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.exampleImageUrl}
          alt={item.title}
          loading="lazy"
          className="h-48 w-full object-cover transition-transform duration-500"
          style={{ transform: hovered ? "scale(1.05)" : "scale(1)" }}
        />
        <div className="absolute left-2.5 top-2.5">
          <AIModelBadge model={item.aiModel} />
        </div>
        <div className="absolute right-2.5 top-2.5">
          <PromptScoreBadge score={item.promptScore} size="md" showLabel />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-text-muted uppercase tracking-wide">{item.category}</span>
            <span className={`text-[10px] font-semibold ${difficultyColors[item.difficulty]}`}>
              {item.difficulty}
            </span>
          </div>
          <h3 className="text-sm font-bold text-text-primary group-hover:text-neon-cyan transition-colors">
            {item.title}
          </h3>
          <p className="mt-1 text-[11px] text-text-secondary line-clamp-2">{item.description}</p>
        </div>

        {/* Prompt preview */}
        <div className="rounded-lg bg-black/30 border border-white/5 p-2.5">
          <p className="text-[10px] text-text-muted font-mono line-clamp-3 leading-relaxed">
            {item.prompt}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[9px] text-text-muted">
              {tag}
            </span>
          ))}
        </div>

        {/* Usage count */}
        <div className="flex items-center gap-1 text-[10px] text-text-muted">
          <Users size={10} />
          <span>{item.usageCount} mints</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Link
            href={`/create?prompt=${encodeURIComponent(item.prompt)}&model=${item.aiModel}`}
            className="flex-1 rounded-md border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-2 text-[11px] font-medium text-neon-cyan hover:bg-neon-cyan/20 transition-colors text-center"
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              <Sparkles size={12} />
              Use Prompt
              <ArrowRight size={12} />
            </span>
          </Link>
          <button
            onClick={copyPrompt}
            className="rounded-md border border-white/10 bg-bg-card px-3 py-2 text-[11px] text-text-muted hover:text-text-primary hover:border-white/20 transition-colors"
          >
            <Copy size={12} />
          </button>
        </div>
        {copied && (
          <p className="text-[10px] text-neon-green text-center">Copied!</p>
        )}
      </div>
    </div>
  );
}
