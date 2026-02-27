"use client";

import { useParams } from "next/navigation";
import { mockCollections, mockNFTs } from "@/lib/mock-data";
import { formatNumber, formatStx } from "@/lib/utils";
import { Heart, ShoppingCart, Share2, MoreHorizontal } from "lucide-react";
import Link from "next/link";

export default function CollectionDetailPage() {
  const params = useParams();
  const collectionId = params.id as string;
  
  const collection = mockCollections.find(c => c.id === collectionId) || mockCollections[0];
  const collectionNFTs = mockNFTs.slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Collection Header */}
      <section className="neon-card overflow-hidden">
        <div className="relative h-48 bg-gradient-to-r from-neon-purple/20 to-neon-cyan/20">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        </div>
        <div className="relative px-6 pb-6">
          <div className="-mt-16 flex flex-wrap items-end gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={collection.avatarUrl}
              alt={collection.name}
              className="h-32 w-32 rounded-2xl border-4 border-bg-primary object-cover"
            />
            <div className="flex-1 pb-2">
              <h1 className="font-heading text-2xl font-semibold text-text-primary">
                {collection.name}
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                By <span className="text-neon-cyan">{collection.creator?.bnsName || 'Unknown'}</span>
              </p>
            </div>
            <div className="flex gap-2 pb-2">
              <button className="btn-secondary flex items-center gap-2 text-sm">
                <Share2 size={14} />
                Share
              </button>
              <button className="p-2 rounded-lg border border-white/10 text-text-secondary hover:text-text-primary transition-colors">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>
          
          <p className="mt-4 text-sm text-text-secondary max-w-2xl">
            A unique collection of AI-generated NFTs on Stacks, secured by Bitcoin.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-bg-card/50 p-3">
              <p className="text-xs text-text-muted">Floor Price</p>
              <p className="mt-1 font-mono text-lg text-neon-orange">
                {collection.floorPriceStx.toFixed(2)} STX
              </p>
            </div>
            <div className="rounded-lg bg-bg-card/50 p-3">
              <p className="text-xs text-text-muted">Total Volume</p>
              <p className="mt-1 font-mono text-lg text-text-primary">
                {formatStx(collection.volumeStx * 1_000_000, 0)}
              </p>
            </div>
            <div className="rounded-lg bg-bg-card/50 p-3">
              <p className="text-xs text-text-muted">Items</p>
              <p className="mt-1 text-lg text-text-primary">
                {formatNumber(collection.itemCount)}
              </p>
            </div>
            <div className="rounded-lg bg-bg-card/50 p-3">
              <p className="text-xs text-text-muted">Owners</p>
              <p className="mt-1 text-lg text-text-primary">
                {formatNumber(collection.uniqueOwners)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="flex flex-wrap items-center gap-3">
        <select className="rounded-lg border border-white/10 bg-bg-card px-3 py-2 text-xs text-text-secondary focus:border-neon-cyan/50 focus:outline-none">
          <option>Price: Low to High</option>
          <option>Price: High to Low</option>
          <option>Recently Listed</option>
          <option>Rarity: High to Low</option>
        </select>
        <div className="flex gap-2">
          {["All", "Buy Now", "On Auction"].map((filter) => (
            <button
              key={filter}
              className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                filter === "All"
                  ? "bg-neon-cyan/20 text-neon-cyan"
                  : "bg-bg-card text-text-muted hover:text-text-secondary"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      {/* NFT Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {collectionNFTs.map((nft) => (
          <article key={nft.id} className="neon-card overflow-hidden group">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={nft.imageUrl}
                alt={nft.name}
                className="h-48 w-full object-cover transition-transform group-hover:scale-105"
              />
              <button className="absolute right-2 top-2 rounded-full bg-black/65 p-1.5 text-text-secondary hover:text-neon-pink transition-colors">
                <Heart size={14} />
              </button>
            </div>
            <div className="space-y-2 p-3">
              <p className="truncate text-sm font-medium text-text-primary">{nft.name}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-neon-orange">{nft.priceStx.toFixed(2)} STX</span>
                <span className="text-text-muted">#{nft.id}</span>
              </div>
              <button className="w-full rounded-md border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-1.5 text-xs text-neon-cyan hover:bg-neon-cyan/20 transition-colors">
                <span className="inline-flex items-center gap-1">
                  <ShoppingCart size={12} />
                  Buy Now
                </span>
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
