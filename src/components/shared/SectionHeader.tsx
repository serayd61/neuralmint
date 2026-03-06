interface SectionHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function SectionHeader({ title, children }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div
          className="w-1 h-6 rounded-full"
          style={{ background: "linear-gradient(180deg, #00E5FF, #A855F7)" }}
        />
        <h2 className="font-heading text-lg font-bold text-text-primary tracking-tight">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
