"use client";

import { useState, useMemo, useEffect } from "react";
import { useWalletStore } from "@/stores/wallet-store";
import { NFT_CONTRACT_ADDRESS, NFT_CONTRACT_NAME } from "@/lib/constants";
import { getPromptTier } from "@/lib/prompt-utils";
import { ExploreHero } from "./_components/ExploreHero";
import { FilterBar } from "./_components/FilterBar";
import { NFTGrid } from "./_components/NFTGrid";
import { NFTDetailModal } from "./_components/NFTDetailModal";
import type { ExploreFilters, NFTItem } from "@/lib/types";
import { Sparkles } from "lucide-react";
import Link from "next/link";

const DEFAULT_FILTERS: ExploreFilters = {
  search: "",
  category: null,
  aiModel: null,
  priceRange: [0, 10000],
  promptScoreRange: [0, 100],
  promptTier: null,
  sortBy: "trending",
  saleType: "all",
};

export default function ExploreClient() {
  const { isConnected } = useWalletStore();
  const [filters, setFilters] = useState<ExploreFilters>(DEFAULT_FILTERS);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [selectedNft, setSelectedNft] = useState<NFTItem | null>(null);
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalNfts: 0, totalVolume: 0, activeCreators: 0 });

  // Fetch real platform stats
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/v1/stats");
        if (res.ok) {
          const data = await res.json();
          setStats({
            totalNfts: data.totalMinted || 0,
            totalVolume: data.totalVolume || 0,
            activeCreators: data.collectionsCount || 1,
          });
        }
      } catch {}
    })();
  }, []);

  // Fetch NFTs from chain
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Try to fetch real listings from API
        const res = await fetch("/api/v1/listings");
        if (res.ok) {
          const data = await res.json();
          if (data.listings && data.listings.length > 0) {
            setNfts(data.listings);
            setLoading(false);
            return;
          }
        }
      } catch {}

      // Try fetching minted NFTs directly from chain
      try {
        const collectionsRes = await fetch("/api/collections");
        if (collectionsRes.ok) {
          const colData = await collectionsRes.json();
          const totalMinted = colData.collections?.[0]?.totalMinted || 0;

          if (totalMinted > 0) {
            const fetchedNfts: NFTItem[] = [];
            const startId = Math.max(1, totalMinted - 19);

            for (let id = totalMinted; id >= startId; id--) {
              try {
                const uri = await fetchTokenUri(id);
                if (uri) {
                  const metadata = await fetchMetadata(uri);
                  if (metadata) {
                    const score = metadata.properties?.prompt_score || undefined;
                    fetchedNfts.push({
                      id: String(id),
                      tokenId: id,
                      name: metadata.name || `NeuralMint #${id}`,
                      imageUrl: metadata.image || "",
                      creator: { address: NFT_CONTRACT_ADDRESS, bnsName: "neuralmint", avatarUrl: "" },
                      owner: { address: "", bnsName: "" },
                      priceStx: 0,
                      usdEquivalent: 0,
                      aiModel: (metadata.attributes?.find((a: any) => a.trait_type === "AI Model")?.value?.toLowerCase().includes("dall") ? "dall-e-3" : "stable-diffusion") as "dall-e-3" | "stable-diffusion",
                      rarity: score ?? 50,
                      likeCount: 0,
                      isLiked: false,
                      category: "Art",
                      collection: "NeuralMint",
                      isAuction: false,
                      prompt: metadata.properties?.prompt || "",
                      promptScore: score,
                      promptTier: score ? getPromptTier(score) : undefined,
                    });
                  }
                }
              } catch {}
            }
            if (fetchedNfts.length > 0) {
              setNfts(fetchedNfts);
              setLoading(false);
              return;
            }
          }
        }
      } catch {}

      setNfts([]);
      setLoading(false);
    })();
  }, []);

  const featuredNFTs = useMemo(
    () => [...nfts].sort((a, b) => (b.promptScore ?? 0) - (a.promptScore ?? 0)).slice(0, 3),
    [nfts]
  );

  const filteredNFTs = useMemo(() => {
    let result = [...nfts];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (nft) =>
          nft.name.toLowerCase().includes(q) ||
          nft.collection?.toLowerCase().includes(q) ||
          nft.creator.bnsName.toLowerCase().includes(q) ||
          nft.prompt?.toLowerCase().includes(q)
      );
    }
    if (filters.category) result = result.filter((nft) => nft.category === filters.category);
    if (filters.aiModel) result = result.filter((nft) => nft.aiModel === filters.aiModel);
    if (filters.saleType === "buy-now") result = result.filter((nft) => !nft.isAuction);
    else if (filters.saleType === "auction") result = result.filter((nft) => nft.isAuction);
    if (filters.promptTier) {
      result = result.filter((nft) => {
        if (nft.promptScore == null) return false;
        return getPromptTier(nft.promptScore) === filters.promptTier;
      });
    }
    // Price range filter
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) {
      result = result.filter(
        (nft) => nft.priceStx >= filters.priceRange[0] && nft.priceStx <= filters.priceRange[1]
      );
    }
    switch (filters.sortBy) {
      case "price-low": result.sort((a, b) => a.priceStx - b.priceStx); break;
      case "price-high": result.sort((a, b) => b.priceStx - a.priceStx); break;
      case "prompt-score": result.sort((a, b) => (b.promptScore ?? 0) - (a.promptScore ?? 0)); break;
      case "trending": result.sort((a, b) => b.likeCount - a.likeCount); break;
      case "recent": result.sort((a, b) => (b.tokenId || 0) - (a.tokenId || 0)); break;
    }
    return result;
  }, [filters, nfts]);

  const handleBuy = async (nft: NFTItem) => {
    if (!isConnected) { alert("Please connect your wallet first"); return; }
    setBuyingId(nft.id);
    try {
      const { buyItem } = await import("@/lib/contracts");
      await buyItem({ listingId: parseInt(nft.id), nftContract: `${NFT_CONTRACT_ADDRESS}.${NFT_CONTRACT_NAME}` });
    } catch (error) { console.error("Buy failed:", error); }
    finally { setBuyingId(null); }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {featuredNFTs.length > 0 && <ExploreHero featuredNFTs={featuredNFTs} stats={stats} />}

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">
          <span className="font-mono text-text-secondary">{filteredNFTs.length}</span> NFTs found
        </p>
      </div>

      {loading ? (
        <NFTGrid nfts={[]} loading onBuy={handleBuy} onSelect={setSelectedNft} buyingId={buyingId} />
      ) : nfts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 py-24 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-neon-cyan/20 bg-neon-cyan/5">
            <Sparkles size={32} className="text-neon-cyan" />
          </div>
          <h3 className="text-lg font-semibold text-white">No NFTs listed yet</h3>
          <p className="mt-2 max-w-md text-sm text-white/40">
            Be the first to create and list an AI-generated NFT on NeuralMint!
          </p>
          <Link
            href="/create"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple px-6 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-neon-cyan/20 transition-all"
          >
            <Sparkles size={16} />
            Create Your First NFT
          </Link>
        </div>
      ) : (
        <NFTGrid nfts={filteredNFTs} onBuy={handleBuy} onSelect={setSelectedNft} buyingId={buyingId} />
      )}

      <NFTDetailModal nft={selectedNft} onClose={() => setSelectedNft(null)} onBuy={handleBuy} buying={buyingId === selectedNft?.id} />
    </div>
  );
}

async function fetchTokenUri(tokenId: number): Promise<string | null> {
  try {
    const hexTokenId = "01" + tokenId.toString(16).padStart(32, "0");
    const res = await fetch(
      `https://api.mainnet.hiro.so/v2/contracts/call-read/${NFT_CONTRACT_ADDRESS}/${NFT_CONTRACT_NAME}/get-token-uri`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sender: NFT_CONTRACT_ADDRESS, arguments: [`0x${hexTokenId}`] }) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const hex = data.result?.slice(2) || "";
    if (!hex.startsWith("070a0d")) return null;
    const length = parseInt(hex.slice(6, 14), 16);
    const strHex = hex.slice(14, 14 + length * 2);
    const bytes = new Uint8Array(strHex.match(/.{2}/g)!.map((b: string) => parseInt(b, 16)));
    return new TextDecoder().decode(bytes);
  } catch { return null; }
}

async function fetchMetadata(uri: string): Promise<any | null> {
  try {
    const url = uri.startsWith("ipfs://") ? `https://cloudflare-ipfs.com/ipfs/${uri.slice(7)}` : uri;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}
