import { SlidersHorizontal, Search, Heart, Gavel, ShoppingCart } from "lucide-react";
import { mockNFTs } from "@/lib/mock-data";

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Marketplace</p>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">Explore NFTs</h1>
        </div>
        <div className="inline-flex items-center rounded-lg border border-white/10 bg-bg-card/70 p-1 text-xs">
          <button className="rounded-md bg-bg-hover px-3 py-1.5 text-text-primary">Grid</button>
          <button className="rounded-md px-3 py-1.5 text-text-muted">List</button>
        </div>
      </header>

      <section className="glass rounded-xl border border-white/10 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search NFTs, collections, creators..."
              className="w-full rounded-lg border border-white/10 bg-bg-card pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-cyan/50 focus:outline-none"
            />
          </label>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-xs text-text-secondary hover:text-neon-cyan">
            <SlidersHorizontal size={15} />
            Filters
          </button>
          <select className="rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-xs text-text-secondary focus:border-neon-cyan/50 focus:outline-none">
            <option>Recently Listed</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Most Liked</option>
          </select>
          <button className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-2.5 text-xs text-neon-cyan">
            Clear
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          {["Buy Now", "On Auction", "DALL-E 3", "Rare+"].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-neon-purple/20 bg-neon-purple/10 px-2.5 py-1 text-neon-purple"
            >
              {chip}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mockNFTs.map((nft) => (
          <article key={nft.id} className="neon-card overflow-hidden">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={nft.imageUrl} alt={nft.name} className="h-48 w-full object-cover" />
              <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-0.5 text-[10px] text-neon-cyan">
                {nft.aiModel === "dall-e-3" ? "DALL-E 3" : "Stable Diffusion"}
              </span>
              <button className="absolute right-2 top-2 rounded-full bg-black/65 p-1.5 text-text-secondary hover:text-neon-pink">
                <Heart size={13} />
              </button>
            </div>
            <div className="space-y-2 p-3">
              <p className="truncate text-xs text-text-muted">{nft.collection || "NeuralMint"}</p>
              <h3 className="truncate text-sm font-semibold text-text-primary">{nft.name}</h3>
              <p className="truncate text-[11px] text-text-secondary">{nft.creator.bnsName}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-neon-orange">{nft.priceStx.toFixed(2)} STX</span>
                <span className="text-text-muted">Rarity {nft.rarity}</span>
              </div>
              <div className="flex gap-2 pt-1">
                {nft.isAuction ? (
                  <button className="flex-1 rounded-md border border-neon-purple/30 bg-neon-purple/10 px-2 py-1.5 text-[11px] text-neon-purple">
                    <span className="inline-flex items-center gap-1">
                      <Gavel size={12} />
                      Place Bid
                    </span>
                  </button>
                ) : (
                  <button className="flex-1 rounded-md border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-1.5 text-[11px] text-neon-cyan">
                    <span className="inline-flex items-center gap-1">
                      <ShoppingCart size={12} />
                      Buy Now
                    </span>
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
