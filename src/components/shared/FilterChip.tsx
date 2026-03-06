"use client";

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-[11px] transition-all ${
        active
          ? "border-neon-purple/40 bg-neon-purple/20 text-neon-purple"
          : "border-white/10 bg-bg-card text-text-muted hover:border-neon-purple/20"
      }`}
    >
      {label}
    </button>
  );
}
