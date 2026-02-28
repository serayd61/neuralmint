"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";
import { DEPLOYED_COLLECTIONS } from "@/lib/blockchain-service";

interface CollectionData {
  contractId: string;
  name: string;
  symbol: string;
  totalMinted: number;
  maxSupply: number;
  floorPrice: number;
  volume: number;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [stxPrice, setStxPrice] = useState<number>(1.50);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/collections");
        if (res.ok) {
          const data = await res.json();
          setCollections(data.collections || []);
          setStxPrice(data.stxPrice || 1.50);
        }
      } catch (error) {
        console.error("Failed to fetch collections:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const totalVolume = collections.reduce((sum, c) => sum + c.volume, 0);
  const totalMinted = collections.reduce((sum, c) => sum + c.totalMinted, 0);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-neon-green border-t-transparent" />
            <p className="mt-4 text-sm text-text-muted">Loading collections...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Marketplace</p>
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Collections</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Explore AI-generated NFT collections on Stacks
        </p>
      </header>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="neon-card p-4">
          <p className="text-[11px] uppercase tracking-[0.15em] text-text-muted">Total Collections</p>
          <p className="mt-1 text-xl font-semibold text-neon-green">{collections.length}</p>
        </div>
        <div className="neon-card p-4">
          <p className="text-[11px] uppercase tracking-[0.15em] text-text-muted">Total NFTs Minted</p>
          <p className="mt-1 text-xl font-semibold text-neon-cyan">{formatNumber(totalMinted)}</p>
        </div>
        <div className="neon-card p-4">
          <p className="text-[11px] uppercase tracking-[0.15em] text-text-muted">Total Volume</p>
          <p className="mt-1 text-xl font-semibold text-neon-orange">{formatNumber(totalVolume)} STX</p>
        </div>
        <div className="neon-card p-4">
          <p className="text-[11px] uppercase tracking-[0.15em] text-text-muted">STX Price</p>
          <p className="mt-1 text-xl font-semibold text-text-primary">${stxPrice.toFixed(2)}</p>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection, index) => {
          const collectionInfo = DEPLOYED_COLLECTIONS.find(c => c.contractId === collection.contractId);
          const progress = (collection.totalMinted / collection.maxSupply) * 100;
          
          return (
            <Link
              key={collection.contractId}
              href={`/collections/${collection.symbol.toLowerCase()}`}
              className="neon-card group overflow-hidden transition-all hover:border-neon-green/50"
            >
              {/* Banner */}
              <div className="relative h-32 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${collectionInfo?.imageBase || "https://picsum.photos/seed/col"}${index}/800/300`}
                  alt={collection.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg-card/90 backdrop-blur-sm">
                    <span className="text-sm font-bold text-neon-green">{collection.symbol}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-text-primary">{collection.name}</h3>
                <p className="mt-1 text-xs text-text-muted">
                  {collectionInfo?.description || "AI-generated NFT collection"}
                </p>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-text-muted">Minted</span>
                    <span className="text-text-primary">
                      {collection.totalMinted}/{collection.maxSupply}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg-card">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-neon-green to-neon-cyan transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-bg-card p-2">
                    <p className="text-[10px] text-text-muted">Floor</p>
                    <p className="font-mono text-sm text-neon-orange">{collection.floorPrice} STX</p>
                  </div>
                  <div className="rounded-lg bg-bg-card p-2">
                    <p className="text-[10px] text-text-muted">Volume</p>
                    <p className="font-mono text-sm text-text-primary">{formatNumber(collection.volume)} STX</p>
                  </div>
                </div>

                {/* Mint Button */}
                <button className="mt-4 w-full rounded-lg bg-neon-green/10 py-2.5 text-sm font-medium text-neon-green transition-all hover:bg-neon-green hover:text-black">
                  Mint Now
                </button>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Empty State */}
      {collections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 h-20 w-20 rounded-full bg-bg-card flex items-center justify-center">
            <span className="text-4xl">📦</span>
          </div>
          <h3 className="text-lg font-semibold text-text-primary">No Collections Yet</h3>
          <p className="mt-2 text-sm text-text-muted">
            Collections will appear here once they are deployed
          </p>
        </div>
      )}
    </div>
  );
}
