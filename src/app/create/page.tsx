import { Sparkles, Wand2, ImagePlus, Zap, Coins } from "lucide-react";

export default function CreatePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">AI Studio</p>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">
            Create Your NFT
          </h1>
        </div>
        <div className="rounded-lg border border-neon-cyan/20 bg-neon-cyan/10 px-3 py-1.5 text-xs text-neon-cyan">
          Remaining Credits: 24
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="neon-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">1) AI Model</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 p-3 text-left">
                <p className="text-xs font-semibold text-neon-cyan">DALL-E 3</p>
                <p className="mt-1 text-[11px] text-text-secondary">Photoreal + composition</p>
              </button>
              <button className="rounded-lg border border-white/10 bg-bg-card p-3 text-left hover:border-neon-purple/30">
                <p className="text-xs font-semibold text-text-primary">Stable Diffusion</p>
                <p className="mt-1 text-[11px] text-text-secondary">Fine control + seed options</p>
              </button>
            </div>
          </div>

          <div className="neon-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">2) Prompt</h2>
              <button className="inline-flex items-center gap-1 rounded-md border border-neon-purple/30 bg-neon-purple/10 px-2.5 py-1 text-[11px] text-neon-purple">
                <Wand2 size={12} />
                Enhance with AI
              </button>
            </div>
            <textarea
              rows={6}
              placeholder="Describe your vision..."
              className="w-full rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-cyan/50 focus:outline-none"
              defaultValue="A cyberpunk fox shaman, neon runes, volumetric lights, high detail, futuristic Istanbul skyline."
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <select className="rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-xs text-text-secondary focus:border-neon-cyan/50 focus:outline-none">
                <option>Size: 1024x1024</option>
                <option>Size: 1024x1792</option>
                <option>Size: 1792x1024</option>
              </select>
              <select className="rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-xs text-text-secondary focus:border-neon-cyan/50 focus:outline-none">
                <option>Style: Vivid</option>
                <option>Style: Natural</option>
              </select>
            </div>
            <button className="btn-primary mt-3 inline-flex w-full items-center justify-center gap-2 text-sm">
              <Sparkles size={15} />
              Generate
            </button>
          </div>

          <div className="neon-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">3) Session History</h2>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="shimmer h-16 rounded-md" />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="neon-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">Preview</h2>
              <button className="rounded-md border border-white/10 bg-bg-card px-2.5 py-1 text-[11px] text-text-secondary">
                Regenerate
              </button>
            </div>
            <div className="overflow-hidden rounded-lg border border-white/10">
              <div className="flex h-72 items-center justify-center bg-bg-card text-text-muted">
                <span className="inline-flex items-center gap-2 text-sm">
                  <ImagePlus size={16} />
                  Generated image preview
                </span>
              </div>
            </div>
          </div>

          <div className="neon-card space-y-3 p-4">
            <h2 className="text-sm font-semibold text-text-primary">NFT Metadata</h2>
            <input
              type="text"
              defaultValue="Neon Fox Oracle"
              className="w-full rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-sm text-text-primary focus:border-neon-cyan/50 focus:outline-none"
            />
            <textarea
              rows={3}
              defaultValue="AI generated cyberpunk artwork minted on Stacks."
              className="w-full rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-sm text-text-primary focus:border-neon-cyan/50 focus:outline-none"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-xs text-text-secondary focus:border-neon-cyan/50 focus:outline-none">
                <option>List after mint: Yes</option>
                <option>List after mint: No</option>
              </select>
              <select className="rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-xs text-text-secondary focus:border-neon-cyan/50 focus:outline-none">
                <option>Listing type: Fixed</option>
                <option>Listing type: Auction</option>
                <option>Listing type: Lazy Mint</option>
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="number"
                defaultValue="85"
                className="w-full rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-xs text-text-primary focus:border-neon-cyan/50 focus:outline-none"
              />
              <input
                type="number"
                defaultValue="5"
                className="w-full rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-xs text-text-primary focus:border-neon-cyan/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="neon-card p-4">
            <h2 className="mb-2 text-sm font-semibold text-text-primary">Cost Breakdown</h2>
            <div className="space-y-1.5 text-xs text-text-secondary">
              <p className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1">
                  <Zap size={12} className="text-neon-purple" />
                  AI generation
                </span>
                <span className="font-mono">2.00 STX</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1">
                  <Coins size={12} className="text-neon-orange" />
                  TX fee estimate
                </span>
                <span className="font-mono">0.01 STX</span>
              </p>
              <p className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-text-primary">
                <span>Total</span>
                <span className="font-mono text-neon-cyan">2.01 STX</span>
              </p>
            </div>
            <button className="btn-primary mt-3 w-full text-sm">Mint NFT</button>
          </div>
        </div>
      </section>
    </div>
  );
}
