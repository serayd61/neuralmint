import { mockNFTs, platformStats } from "@/lib/mock-data";
import { formatNumber, formatStx } from "@/lib/utils";

export default function DashboardPage() {
  const myNfts = mockNFTs.slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">My Account</p>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">
            Dashboard
          </h1>
          <p className="mt-1 text-xs text-text-secondary">Welcome back, serkan.btc</p>
        </div>
        <div className="rounded-lg border border-neon-green/20 bg-neon-green/10 px-3 py-1.5 text-xs text-neon-green">
          STX Balance: 2,485.21
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Portfolio Value" value="8,420.50 STX" helper="~$12,630" />
        <StatCard label="24h Change" value="+4.8%" helper="healthy momentum" />
        <StatCard label="Total Earnings" value="1,256.00 STX" helper="all-time sales" />
        <StatCard label="Pending Offers" value="12" helper="inbound + outbound" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="neon-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Portfolio Overview</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat label="Total NFTs" value={formatNumber(myNfts.length)} />
            <MiniStat label="Listed" value="3" />
            <MiniStat label="Auctions" value="2" />
          </div>
          <div className="mt-4 h-44 rounded-lg border border-white/10 bg-bg-card p-3">
            <div className="mb-2 flex items-center justify-between text-[11px] text-text-muted">
              <span>Portfolio chart (7d / 30d / 90d)</span>
              <span className="font-mono text-neon-cyan">STX</span>
            </div>
            <div className="shimmer h-full rounded-md" />
          </div>
        </div>

        <div className="neon-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Market Snapshot</h2>
          <div className="space-y-2 text-xs text-text-secondary">
            <Line label="STX/USD" value={`$${platformStats.stxPriceUsd.toFixed(2)}`} />
            <Line label="Total Volume" value={formatStx(platformStats.totalVolumeStx * 1_000_000, 0)} />
            <Line label="Active Creators" value={formatNumber(platformStats.activeCreators)} />
            <Line label="Floor Price" value={`${platformStats.floorPriceStx.toFixed(2)} STX`} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="neon-card space-y-3 p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">My NFTs</h2>
            <div className="inline-flex items-center rounded-md border border-white/10 bg-bg-card p-1 text-[11px]">
              <button className="rounded px-2 py-1 text-text-primary">All</button>
              <button className="rounded px-2 py-1 text-text-muted">Listed</button>
              <button className="rounded px-2 py-1 text-text-muted">Unlisted</button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {myNfts.map((nft) => (
              <article key={nft.id} className="rounded-lg border border-white/10 bg-bg-card p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={nft.imageUrl}
                  alt={nft.name}
                  className="h-24 w-full rounded-md object-cover"
                />
                <p className="mt-2 truncate text-xs font-medium text-text-primary">{nft.name}</p>
                <p className="text-[11px] text-text-muted">
                  {nft.isAuction ? "Auction active" : "Fixed listing"}
                </p>
                <p className="mt-1 font-mono text-xs text-neon-orange">
                  {nft.priceStx.toFixed(2)} STX
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="neon-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Offers</h2>
            <div className="space-y-2 text-xs text-text-secondary">
              <Line label="Incoming" value="7" />
              <Line label="Outgoing" value="5" />
              <Line label="Best offer" value="440.00 STX" />
            </div>
            <button className="btn-secondary mt-3 w-full text-xs">Manage Offers</button>
          </div>

          <div className="neon-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Notifications</h2>
            <ul className="space-y-2 text-[11px] text-text-secondary">
              <li className="rounded-md bg-bg-card p-2">Your NFT sold for 220 STX</li>
              <li className="rounded-md bg-bg-card p-2">You were outbid on Neon Samurai</li>
              <li className="rounded-md bg-bg-card p-2">New offer: 155 STX on Digital Flora</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <article className="neon-card p-4">
      <p className="text-[11px] uppercase tracking-[0.15em] text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-text-primary">{value}</p>
      <p className="mt-1 text-[11px] text-text-secondary">{helper}</p>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-bg-card p-3">
      <p className="text-[10px] text-text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex items-center justify-between rounded-md bg-bg-card px-2.5 py-2">
      <span>{label}</span>
      <span className="font-mono text-text-primary">{value}</span>
    </p>
  );
}
