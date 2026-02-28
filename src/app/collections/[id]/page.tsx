"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/utils";
import { Share2, MoreHorizontal, Loader2 } from "lucide-react";
import { DEPLOYED_COLLECTIONS } from "@/lib/blockchain-service";
import { useWalletStore } from "@/stores/wallet-store";
import { openContractCall } from "@stacks/connect";
import { principalCV, PostConditionMode } from "@stacks/transactions";

interface CollectionStats {
  contractId: string;
  name: string;
  symbol: string;
  totalMinted: number;
  maxSupply: number;
  floorPrice: number;
  volume: number;
}

export default function CollectionDetailPage() {
  const params = useParams();
  const collectionId = params.id as string;
  const { isConnected, stxAddress } = useWalletStore();
  
  const [collection, setCollection] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);

  const collectionInfo = DEPLOYED_COLLECTIONS.find(
    c => c.name.toLowerCase().includes(collectionId.toLowerCase()) || 
         c.symbol?.toLowerCase() === collectionId.toLowerCase()
  );

  useEffect(() => {
    async function fetchCollection() {
      try {
        const res = await fetch("/api/collections");
        if (res.ok) {
          const data = await res.json();
          const found = data.collections?.find((c: CollectionStats) => 
            c.symbol?.toLowerCase() === collectionId.toLowerCase() ||
            c.name.toLowerCase().includes(collectionId.toLowerCase())
          );
          if (found) {
            setCollection(found);
          }
        }
      } catch (error) {
        console.error("Failed to fetch collection:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCollection();
  }, [collectionId]);

  const handleMint = async () => {
    if (!isConnected || !stxAddress || !collectionInfo) {
      return;
    }

    setMinting(true);
    setMintSuccess(false);

    try {
      const [address, contractName] = collectionInfo.contractId.split(".");
      
      await openContractCall({
        contractAddress: address,
        contractName: contractName,
        functionName: "mint",
        functionArgs: [principalCV(stxAddress)],
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          console.log("Mint transaction:", data.txId);
          setMintSuccess(true);
          setMinting(false);
        },
        onCancel: () => {
          console.log("Mint cancelled");
          setMinting(false);
        },
      });
    } catch (error) {
      console.error("Mint error:", error);
      setMinting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-neon-green border-t-transparent" />
            <p className="mt-4 text-sm text-text-muted">Loading collection...</p>
          </div>
        </div>
      </div>
    );
  }

  const displayCollection = collection || {
    contractId: collectionInfo?.contractId || "",
    name: collectionInfo?.name || "Unknown Collection",
    symbol: collectionInfo?.symbol || "???",
    totalMinted: 0,
    maxSupply: collectionInfo?.maxSupply || 1000,
    floorPrice: 25,
    volume: 0,
  };

  const progress = (displayCollection.totalMinted / displayCollection.maxSupply) * 100;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Collection Header */}
      <section className="neon-card overflow-hidden">
        <div className="relative h-48 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${collectionInfo?.imageBase || "https://picsum.photos/seed/col"}/1200/400`}
            alt={displayCollection.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/50 to-transparent" />
        </div>
        <div className="relative px-6 pb-6">
          <div className="-mt-16 flex flex-wrap items-end gap-6">
            <div className="flex h-32 w-32 items-center justify-center rounded-2xl border-4 border-bg-primary bg-bg-card">
              <span className="text-3xl font-bold text-neon-green">{displayCollection.symbol}</span>
            </div>
            <div className="flex-1 pb-2">
              <h1 className="font-heading text-2xl font-semibold text-text-primary">
                {displayCollection.name.replace(/-/g, " ").replace(/neuralmint /i, "")}
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                By <span className="text-neon-cyan">serkan.btc</span>
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
            {collectionInfo?.description || "A unique collection of AI-generated NFTs on Stacks, secured by Bitcoin."}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-bg-card/50 p-3">
              <p className="text-xs text-text-muted">Floor Price</p>
              <p className="mt-1 font-mono text-lg text-neon-orange">
                {displayCollection.floorPrice} STX
              </p>
            </div>
            <div className="rounded-lg bg-bg-card/50 p-3">
              <p className="text-xs text-text-muted">Total Volume</p>
              <p className="mt-1 font-mono text-lg text-text-primary">
                {formatNumber(displayCollection.volume)} STX
              </p>
            </div>
            <div className="rounded-lg bg-bg-card/50 p-3">
              <p className="text-xs text-text-muted">Minted</p>
              <p className="mt-1 text-lg text-text-primary">
                {displayCollection.totalMinted} / {displayCollection.maxSupply}
              </p>
            </div>
            <div className="rounded-lg bg-bg-card/50 p-3">
              <p className="text-xs text-text-muted">Max Supply</p>
              <p className="mt-1 text-lg text-text-primary">
                {formatNumber(displayCollection.maxSupply)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mint Section */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="neon-card p-6">
          <h2 className="text-lg font-semibold text-text-primary">Mint Your NFT</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Mint a unique NFT from the {displayCollection.name.replace(/neuralmint-/i, "")} collection.
          </p>

          {/* Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Minting Progress</span>
              <span className="text-text-primary">
                {displayCollection.totalMinted} / {displayCollection.maxSupply}
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-bg-card">
              <div
                className="h-full rounded-full bg-gradient-to-r from-neon-green to-neon-cyan transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-text-muted">
              {(100 - progress).toFixed(1)}% remaining
            </p>
          </div>

          {/* Price */}
          <div className="mt-6 rounded-lg bg-bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Mint Price</span>
              <span className="font-mono text-xl text-neon-green">FREE</span>
            </div>
            <p className="mt-1 text-xs text-text-muted">+ network fee (~0.001 STX)</p>
          </div>

          {/* Mint Button */}
          <button
            onClick={handleMint}
            disabled={!isConnected || minting || progress >= 100}
            className={`mt-6 w-full rounded-lg py-3 text-sm font-semibold transition-all ${
              mintSuccess
                ? "bg-neon-green/20 text-neon-green"
                : minting
                ? "bg-neon-cyan/20 text-neon-cyan"
                : "bg-neon-green text-black hover:bg-neon-green/90 disabled:bg-bg-card disabled:text-text-muted"
            }`}
          >
            {minting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Confirm in Wallet...
              </span>
            ) : mintSuccess ? (
              "Minted Successfully!"
            ) : !isConnected ? (
              "Connect Wallet to Mint"
            ) : progress >= 100 ? (
              "Sold Out"
            ) : (
              "Mint Now"
            )}
          </button>

          {!isConnected && (
            <p className="mt-3 text-center text-xs text-text-muted">
              Connect your wallet to mint NFTs
            </p>
          )}
        </div>

        {/* Preview */}
        <div className="neon-card p-6">
          <h2 className="text-lg font-semibold text-text-primary">Preview</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${collectionInfo?.imageBase || "https://picsum.photos/seed/nft"}${i}/400/400`}
                  alt={`Preview ${i}`}
                  className="h-32 w-full object-cover"
                />
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-text-muted text-center">
            Each mint reveals a unique AI-generated artwork
          </p>
        </div>
      </section>

      {/* Collection Info */}
      <section className="neon-card p-6">
        <h2 className="text-lg font-semibold text-text-primary">About This Collection</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-bg-card p-4">
            <p className="text-xs text-text-muted">Contract</p>
            <p className="mt-1 font-mono text-xs text-neon-cyan break-all">
              {displayCollection.contractId}
            </p>
          </div>
          <div className="rounded-lg bg-bg-card p-4">
            <p className="text-xs text-text-muted">Standard</p>
            <p className="mt-1 text-sm text-text-primary">SIP-009 NFT</p>
          </div>
          <div className="rounded-lg bg-bg-card p-4">
            <p className="text-xs text-text-muted">Network</p>
            <p className="mt-1 text-sm text-text-primary">Stacks Mainnet</p>
          </div>
        </div>
      </section>
    </div>
  );
}
