export function SkeletonCard() {
  return (
    <div className="neon-card overflow-hidden">
      <div className="shimmer h-52 w-full" />
      <div className="space-y-2.5 p-4">
        <div className="shimmer h-3 w-20 rounded" />
        <div className="shimmer h-4 w-3/4 rounded" />
        <div className="flex items-center justify-between pt-1">
          <div className="shimmer h-4 w-24 rounded" />
          <div className="shimmer h-4 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}
