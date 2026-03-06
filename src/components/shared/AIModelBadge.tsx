interface AIModelBadgeProps {
  model: "dall-e-3" | "stable-diffusion" | string;
  className?: string;
}

export function AIModelBadge({ model, className = "" }: AIModelBadgeProps) {
  const label = model === "dall-e-3" ? "DALL·E 3" : "Stable Diffusion";

  return (
    <span
      className={`rounded-full bg-black/70 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold text-neon-cyan border border-neon-cyan/20 ${className}`}
    >
      {label}
    </span>
  );
}
