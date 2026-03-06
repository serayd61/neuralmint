"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, ExternalLink, Copy, Check, Sparkles, ShoppingCart,
  Cpu, Loader2, Eye, Hash, Shield, Tag, User, Clock, Layers,
} from "lucide-react";
import { NFT_CONTRACT_ADDRESS, NFT_CONTRACT_NAME, STACKS_API_URL } from "@/lib/constants";
import { PromptScoreBadge } from "@/components/shared/PromptScoreBadge";
import { RarityBadgeFromScore } from "@/components/rarity-badge";
import { getGatewayUrls } from "@/lib/ipfs";
import { truncateAddress } from "@/lib/utils";
import { useWalletStore } from "@/stores/wallet-store";
import { scorePrompt } from "@/lib/prompt-scoring";
import { getPromptTier, PROMPT_TIER_CONFIG } from "@/lib/prompt-utils";

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  properties?: {
    aiModel?: string;
    promptHash?: string;
    prompt?: string;
    prompt_score?: number;
    rarity_tier?: string;
    generationParams?: string;
    [key: string]: unknown;
  };
}

interface TransferEvent {
  tx_id: string;
  sender: string;
  recipient: string;
  block_height: number;
}

export default function NFTDetailPage() {
  const params = useParams();
  const tokenId = Number(params.id);
  const { isConnected } = useWalletStore();
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [owner, setOwner] = useState<string>("");
  const [transfers, setTransfers] = useState<TransferEvent[]>([]);
  const [similarNfts, setSimilarNfts] = useState<Array<{ id: number; name: string; image: string; score: number }>>([]);
  const [lightbox, setLightbox] = useState(false);
  const [stxPrice, setStxPrice] = useState(0);

  // Fetch NFT metadata
  useEffect(() => {
    if (!tokenId || isNaN(tokenId)) { setLoading(false); return; }
    (async () => {
      try {
        const hexTokenId = "01" + tokenId.toString(16).padStart(32, "0");
        const res = await fetch(
          `${STACKS_API_URL}/v2/contracts/call-read/${NFT_CONTRACT_ADDRESS}/${NFT_CONTRACT_NAME}/get-token-uri`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sender: NFT_CONTRACT_ADDRESS, arguments: [`0x${hexTokenId}`] }),
          }
        );
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        const hex = data.result?.slice(2) || "";
        if (!hex.startsWith("070a0d")) { setLoading(false); return; }
        const length = parseInt(hex.slice(6, 14), 16);
        const strHex = hex.slice(14, 14 + length * 2);
        const bytes = new Uint8Array(strHex.match(/.{2}/g)!.map((b: string) => parseInt(b, 16)));
        const uri = new TextDecoder().decode(bytes);
        const metaUrl = uri.startsWith("ipfs://") ? `https://cloudflare-ipfs.com/ipfs/${uri.slice(7)}` : uri;
        const metaRes = await fetch(metaUrl, { signal: AbortSignal.timeout(15000) });
        if (metaRes.ok) setMetadata(await metaRes.json());
      } catch (err) {
        console.error("NFT fetch error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [tokenId]);

  // Fetch NFT owner via Hiro NFT events
  useEffect(() => {
    if (!tokenId || isNaN(tokenId)) return;
    (async () => {
      try {
        const contractId = `${NFT_CONTRACT_ADDRESS}.${NFT_CONTRACT_NAME}`;
        const hexVal = "01" + tokenId.toString(16).padStart(32, "0");
        const eventsRes = await fetch(
          `${STACKS_API_URL}/extended/v1/tokens/nft/history?asset_identifier=${contractId}::neuralmint-nft&value=0x${hexVal}&limit=20`
        );
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          const results = eventsData.results || [];
          if (results.length > 0) {
            setOwner(results[0].recipient || results[0].sender || "");
          }
          const txEvents: TransferEvent[] = results.map((e: any) => ({
            tx_id: e.tx_id || "",
            sender: e.sender || "",
            recipient: e.recipient || "",
            block_height: e.block_height || 0,
          }));
          setTransfers(txEvents);
        }
      } catch {}
    })();
  }, [tokenId]);

  // Fetch STX price
  useEffect(() => {
    fetch("/api/price")
      .then((res) => res.json())
      .then((data) => setStxPrice(data.stxPrice || 0))
      .catch(() => {});
  }, []);

  // Fetch similar NFTs (adjacent token IDs)
  useEffect(() => {
    if (!tokenId || isNaN(tokenId)) return;
    (async () => {
      const similar: Array<{ id: number; name: string; image: string; score: number }> = [];
      const ids = [tokenId - 2, tokenId - 1, tokenId + 1, tokenId + 2].filter((id) => id > 0 && id !== tokenId);
      for (const id of ids.slice(0, 4)) {
        try {
          const hexId = "01" + id.toString(16).padStart(32, "0");
          const res = await fetch(
            `${STACKS_API_URL}/v2/contracts/call-read/${NFT_CONTRACT_ADDRESS}/${NFT_CONTRACT_NAME}/get-token-uri`,
            { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sender: NFT_CONTRACT_ADDRESS, arguments: [`0x${hexId}`] }) }
          );
          if (!res.ok) continue;
          const data = await res.json();
          const hex = data.result?.slice(2) || "";
          if (!hex.startsWith("070a0d")) continue;
          const length = parseInt(hex.slice(6, 14), 16);
          const strHex = hex.slice(14, 14 + length * 2);
          const bytes = new Uint8Array(strHex.match(/.{2}/g)!.map((b: string) => parseInt(b, 16)));
          const uri = new TextDecoder().decode(bytes);
          const metaUrl = uri.startsWith("ipfs://") ? `https://cloudflare-ipfs.com/ipfs/${uri.slice(7)}` : uri;
          const metaRes = await fetch(metaUrl, { signal: AbortSignal.timeout(8000) });
          if (metaRes.ok) {
            const meta = await metaRes.json();
            similar.push({ id, name: meta.name || `NeuralMint #${id}`, image: meta.image || "", score: meta.properties?.prompt_score || 0 });
          }
        } catch {}
      }
      setSimilarNfts(similar);
    })();
  }, [tokenId]);

  const aiModel = metadata?.attributes?.find((a) => a.trait_type === "AI Model")?.value || metadata?.properties?.aiModel || "";
  const promptHash = metadata?.properties?.promptHash || "";
  const prompt = metadata?.properties?.prompt || "";
  const promptScore = metadata?.properties?.prompt_score;
  const localScore = prompt ? scorePrompt(prompt, aiModel.includes("dall") ? "dall-e-3" : "sdxl") : null;
  const displayScore = promptScore ?? localScore?.overall ?? 0;
  const tier = displayScore > 0 ? getPromptTier(displayScore) : "common";
  const tierConfig = PROMPT_TIER_CONFIG[tier];

  const genParams = useMemo(() => {
    if (!metadata?.properties?.generationParams) return null;
    try { return JSON.parse(metadata.properties.generationParams as string); } catch { return null; }
  }, [metadata]);

  const imageUrls = useMemo(() => metadata?.image ? getGatewayUrls(metadata.image) : [], [metadata]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleBuy = async () => {
    if (!isConnected) return;
    try {
      const { buyItem } = await import("@/lib/contracts");
      await buyItem({ listingId: tokenId, nftContract: `${NFT_CONTRACT_ADDRESS}.${NFT_CONTRACT_NAME}` });
    } catch (error) { console.error("Buy failed:", error); }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-neon-cyan" /></div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Eye size={32} className="text-white/15 mb-4" />
          <h2 className="text-xl font-semibold text-white">NFT Not Found</h2>
          <p className="mt-2 text-sm text-white/40">Token #{tokenId} does not exist or metadata is unavailable.</p>
          <Link href="/explore" className="mt-6 btn-primary text-sm">Back to Explore</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <Link href="/explore" className="mb-6 inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-neon-cyan transition-colors">
        <ArrowLeft size={14} /> Back to Explore
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Image + Attributes + Gen Params + Transfer History */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-white/[0.06] cursor-pointer" onClick={() => setLightbox(true)}>
            <NFTImage urls={imageUrls} alt={metadata.name} />
          </div>

          {metadata.attributes && metadata.attributes.length > 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Tag size={14} className="text-neon-purple" />Attributes</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {metadata.attributes.map((attr, i) => (
                  <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-2.5">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">{attr.trait_type}</p>
                    <p className="mt-0.5 text-xs font-medium text-white/70 truncate">{attr.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {genParams && (
            <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Cpu size={14} className="text-neon-cyan" />Generation Parameters</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(genParams).map(([key, val]) => (
                  <div key={key} className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-2">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">{key.replace(/_/g, " ")}</p>
                    <p className="mt-0.5 text-xs font-mono text-white/60 truncate">{String(val)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {transfers.length > 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Clock size={14} className="text-neon-orange" />Ownership History</h3>
              <div className="space-y-2">
                {transfers.map((tx, i) => (
                  <div key={`${tx.tx_id}-${i}`} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.04] p-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-neon-cyan/10 flex items-center justify-center shrink-0">
                        <ArrowLeft size={10} className="text-neon-cyan rotate-180" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-white/30">{tx.sender ? truncateAddress(tx.sender) : "Mint"} → {truncateAddress(tx.recipient)}</p>
                        <p className="text-[9px] text-white/20 font-mono">Block #{tx.block_height}</p>
                      </div>
                    </div>
                    <a href={`https://explorer.hiro.so/txid/${tx.tx_id}?chain=mainnet`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/30 hover:text-neon-cyan transition-colors shrink-0">
                      <ExternalLink size={10} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="space-y-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-semibold">NeuralMint</p>
            <h1 className="mt-1 text-2xl font-bold text-white">{metadata.name}</h1>
            {metadata.description && <p className="mt-2 text-sm leading-relaxed text-white/50">{metadata.description}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {aiModel && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/[0.05] px-2 py-1 text-[10px] text-white/60 ring-1 ring-white/10">
                  <Cpu size={10} />{aiModel.toLowerCase().includes("dall") ? "DALL-E 3" : "Stable Diffusion XL"}
                </span>
              )}
              <span className="text-[10px] text-white/25 font-mono">#{tokenId}</span>
              {owner && <span className="inline-flex items-center gap-1 text-[10px] text-white/40"><User size={10} />Owner: {truncateAddress(owner)}</span>}
            </div>
          </div>

          {/* AI Provenance */}
          <div className="rounded-2xl border border-neon-cyan/15 bg-neon-cyan/[0.03] p-5 space-y-4">
            <h3 className="text-sm font-semibold text-neon-cyan flex items-center gap-2"><Shield size={14} />AI Provenance</h3>
            {displayScore > 0 && (
              <div className="flex items-center justify-between rounded-xl p-3" style={{ background: tierConfig.bgColor, border: `1px solid ${tierConfig.borderColor}` }}>
                <div className="flex items-center gap-3">
                  <PromptScoreBadge score={displayScore} size="lg" showLabel />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: tierConfig.color }}>{tierConfig.label} Tier</p>
                    <p className="text-[10px] text-white/30">Prompt Quality Score</p>
                  </div>
                </div>
                <RarityBadgeFromScore score={displayScore} size="md" />
              </div>
            )}
            {localScore && (
              <div className="grid grid-cols-2 gap-2">
                <ScoreBar label="Specificity" value={localScore.specificity} max={25} />
                <ScoreBar label="Technical" value={localScore.technicalQuality} max={25} />
                <ScoreBar label="Creativity" value={localScore.creativity} max={25} />
                <ScoreBar label="Artistic" value={localScore.artisticDirection} max={25} />
              </div>
            )}
            {prompt && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-white/40">Prompt</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleCopy(prompt, "prompt")} className="inline-flex items-center gap-1 text-[10px] text-white/30 hover:text-neon-cyan transition-colors">
                      {copied === "prompt" ? <Check size={10} /> : <Copy size={10} />}{copied === "prompt" ? "Copied" : "Copy"}
                    </button>
                    <Link href={`/create?prompt=${encodeURIComponent(prompt)}`} className="inline-flex items-center gap-1 text-[10px] text-neon-purple hover:text-neon-purple/80 transition-colors">
                      <Sparkles size={10} /> Get Inspired
                    </Link>
                  </div>
                </div>
                <p className="rounded-lg bg-black/30 border border-white/[0.06] p-3 text-xs text-white/50 leading-relaxed font-mono">{prompt}</p>
              </div>
            )}
            {promptHash && (
              <div className="flex items-center justify-between rounded-lg bg-black/20 border border-white/[0.06] p-3">
                <div className="flex items-center gap-2"><Hash size={12} className="text-white/20" /><span className="text-[10px] text-white/30">Prompt Hash (On-Chain)</span></div>
                <button onClick={() => handleCopy(promptHash, "hash")} className="font-mono text-[10px] text-white/40 hover:text-neon-cyan transition-colors truncate max-w-[200px]">
                  {copied === "hash" ? "Copied!" : promptHash.slice(0, 16) + "..."}
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-5 space-y-3">
            <button onClick={handleBuy} disabled={!isConnected} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple px-4 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-neon-cyan/20 transition-all disabled:opacity-50">
              <ShoppingCart size={16} />{isConnected ? "Buy NFT" : "Connect Wallet to Buy"}
            </button>
            <a href={`https://explorer.hiro.so/txid/${NFT_CONTRACT_ADDRESS}.${NFT_CONTRACT_NAME}?chain=mainnet`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-xs text-white/50 hover:text-neon-cyan hover:border-neon-cyan/20 transition-all">
              <ExternalLink size={14} />View on Hiro Explorer
            </a>
            <Link href={prompt ? `/create?prompt=${encodeURIComponent(prompt)}` : "/create"} className="flex items-center justify-center gap-2 rounded-xl border border-neon-purple/20 bg-neon-purple/5 px-4 py-2.5 text-xs text-neon-purple hover:bg-neon-purple/10 transition-all">
              <Sparkles size={14} />Create Similar NFT
            </Link>
          </div>
        </div>
      </div>

      {/* Similar NFTs */}
      {similarNfts.length > 0 && (
        <div className="mt-12 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Layers size={18} className="text-neon-purple" />More from this Collection</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similarNfts.map((nft) => {
              const imgUrls = nft.image ? getGatewayUrls(nft.image) : [];
              return (
                <Link key={nft.id} href={`/nft/${nft.id}`} className="neon-card overflow-hidden group cursor-pointer">
                  <div className="relative">
                    {imgUrls[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imgUrls[0]} alt={nft.name} className="h-40 w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="h-40 w-full bg-white/[0.02] flex items-center justify-center"><Eye size={20} className="text-white/10" /></div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-transparent" />
                    {nft.score > 0 && <div className="absolute right-2 top-2"><PromptScoreBadge score={nft.score} size="sm" /></div>}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-white/80 truncate group-hover:text-neon-cyan transition-colors">{nft.name}</p>
                    <p className="text-[10px] text-white/30 font-mono mt-0.5">#{nft.id}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && imageUrls[0] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-pointer" onClick={() => setLightbox(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrls[0]} alt={metadata.name} className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}

function NFTImage({ urls, alt }: { urls: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const onError = useCallback(() => { if (idx < urls.length - 1) setIdx((i) => i + 1); else setFailed(true); }, [idx, urls.length]);
  const src = urls[idx] || "";
  if (!src || failed) return <div className="flex h-96 items-center justify-center bg-white/[0.02]"><Eye size={32} className="text-white/10" /></div>;
  return (
    <div className="relative">
      {!loaded && <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02]"><Loader2 size={24} className="animate-spin text-white/15" /></div>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={`w-full object-cover transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`} style={{ maxHeight: "600px" }} onLoad={() => setLoaded(true)} onError={onError} />
    </div>
  );
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = (value / max) * 100;
  return (
    <div className="rounded-lg bg-black/20 border border-white/[0.04] p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-white/40">{label}</span>
        <span className="text-[10px] font-mono text-white/50">{value}/{max}</span>
      </div>
      <div className="h-1 rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 80 ? "#FFE600" : pct >= 60 ? "#A855F7" : pct >= 40 ? "#00E5FF" : "#6B7280" }} />
      </div>
    </div>
  );
}
