"use client";

import { Search, TrendingUp, TrendingDown } from "lucide-react";
import { mockCollections } from "@/lib/mock-data";
import { formatNumber, formatStx, formatPercentChange } from "@/lib/utils";
import Link from "next/link";

export default function CollectionsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Browse</p>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">
            Collections
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search collections..."
              className="w-64 rounded-lg border border-white/10 bg-bg-card pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-cyan/50 focus:outline-none"
            />
          </div>
          <select className="rounded-lg border border-white/10 bg-bg-card px-3 py-2 text-xs text-text-secondary focus:border-neon-cyan/50 focus:outline-none">
            <option>Volume: High to Low</option>
            <option>Volume: Low to High</option>
            <option>Floor: High to Low</option>
            <option>Floor: Low to High</option>
          </select>
        </div>
      </header>

      <section className="neon-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-text-muted">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Collection</th>
                <th className="px-4 py-3 font-medium text-right">Floor Price</th>
                <th className="px-4 py-3 font-medium text-right">24h %</th>
                <th className="px-4 py-3 font-medium text-right">Volume</th>
                <th className="px-4 py-3 font-medium text-right">Items</th>
                <th className="px-4 py-3 font-medium text-right">Owners</th>
              </tr>
            </thead>
            <tbody>
              {mockCollections.map((collection, index) => (
                <tr
                  key={collection.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/5"
                >
                  <td className="px-4 py-4 text-sm text-text-muted">{index + 1}</td>
                  <td className="px-4 py-4">
                    <Link href={`/collections/${collection.id}`} className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={collection.avatarUrl}
                        alt={collection.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-text-primary hover:text-neon-cyan transition-colors">
                          {collection.name}
                        </p>
                        <p className="text-xs text-text-muted">AI Collection</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-mono text-sm text-neon-orange">
                      {collection.floorPriceStx.toFixed(2)} STX
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={`inline-flex items-center gap-1 text-sm ${collection.change24h >= 0 ? "text-neon-green" : "text-neon-red"}`}>
                      {collection.change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {formatPercentChange(collection.change24h)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-mono text-sm text-text-primary">
                      {formatStx(collection.volumeStx * 1_000_000, 0)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-text-secondary">
                    {formatNumber(collection.itemCount)}
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-text-secondary">
                    {formatNumber(collection.uniqueOwners)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex justify-center">
        <button className="btn-secondary text-sm">Load More</button>
      </div>
    </div>
  );
}
