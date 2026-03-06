// ============================================
// NeuralMint — Real Blockchain Data Service
// ============================================

import {
  NFT_CONTRACT_ADDRESS,
  NFT_CONTRACT_NAME,
  STACKS_API_URL,
  NEURALMINT_COLLECTION,
} from "./constants";
import { resolveIpfsUrl, fetchIpfsMetadata, type SIP16Metadata } from "./ipfs";

const HIRO_API = STACKS_API_URL;
const CONTRACT_ID = NEURALMINT_COLLECTION.contractId;

// ── Interfaces ──────────────────────────────────────────

export interface NFTAsset {
  contractId: string;
  tokenId: number;
  name: string;
  description: string;
  collection: string;
  imageUrl: string;
  owner: string;
  attributes: Array<{ trait_type: string; value: string }>;
  aiModel: string;
  isNeuralMint: boolean;
  metadata: SIP16Metadata | null;
}

export interface WalletBalance {
  stx: number;
  stxUsd: number;
}

export interface CollectionStats {
  contractId: string;
  name: string;
  symbol: string;
  totalMinted: number;
  floorPrice: number;
  volume: number;
}

export interface ActivityEvent {
  txId: string;
  type: "mint" | "transfer" | "fee" | "contract-call";
  timestamp: string;
  blockHeight: number;
  tokenId?: number;
  from?: string;
  to?: string;
  amount?: number;
  functionName?: string;
  status: string;
}

// ── Clarity Hex Parsing ─────────────────────────────────

/**
 * Parse Clarity (ok (some "string-ascii")) response.
 * Format: 07 (ok) + 0a (some) + 0d (string-ascii) + 4-byte length + ASCII bytes
 */
function parseClarityStringResponse(hexValue: string): string | null {
  if (!hexValue?.startsWith("0x")) return null;
  try {
    const hex = hexValue.slice(2);
    // 07=ok, 0a=some, 0d=string-ascii
    if (!hex.startsWith("070a0d")) return null;
    const lengthHex = hex.slice(6, 14);
    const length = parseInt(lengthHex, 16);
    const strHex = hex.slice(14, 14 + length * 2);
    const bytes = new Uint8Array(strHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/**
 * Parse Clarity (ok uint) response.
 * Format: 07 (ok) + 01 (uint) + 16 bytes big-endian value
 */
function parseClarityUint(hexValue: string): number {
  if (!hexValue?.startsWith("0x")) return 0;
  try {
    const hex = hexValue.slice(2);
    if (hex.startsWith("0701")) {
      return parseInt(hex.slice(4), 16);
    }
    if (hex.startsWith("01")) {
      return parseInt(hex.slice(2), 16);
    }
    return 0;
  } catch {
    return 0;
  }
}

// ── Contract Read-Only Calls ────────────────────────────

/** Fetch token URI from the NFT contract */
export async function fetchTokenUri(tokenId: number): Promise<string | null> {
  try {
    const hexTokenId = "01" + tokenId.toString(16).padStart(32, "0");
    const res = await fetch(
      `${HIRO_API}/v2/contracts/call-read/${NFT_CONTRACT_ADDRESS}/${NFT_CONTRACT_NAME}/get-token-uri`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: NFT_CONTRACT_ADDRESS,
          arguments: [`0x${hexTokenId}`],
        }),
        next: { revalidate: 300 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return parseClarityStringResponse(data.result);
  } catch {
    return null;
  }
}

/** Fetch the last minted token ID (total minted count) */
export async function fetchLastTokenId(): Promise<number> {
  try {
    const res = await fetch(
      `${HIRO_API}/v2/contracts/call-read/${NFT_CONTRACT_ADDRESS}/${NFT_CONTRACT_NAME}/get-last-token-id`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: NFT_CONTRACT_ADDRESS,
          arguments: [],
        }),
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    return parseClarityUint(data.result);
  } catch {
    return 0;
  }
}

// ── STX Price ───────────────────────────────────────────

export async function fetchSTXPrice(): Promise<number> {
  try {
    const cgRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd",
      { next: { revalidate: 60 } }
    );
    if (cgRes.ok) {
      const data = await cgRes.json();
      if (data.blockstack?.usd) return data.blockstack.usd;
    }
  } catch {}

  try {
    const alexRes = await fetch("https://api.alexgo.io/v1/price/STX", {
      next: { revalidate: 60 },
    });
    if (alexRes.ok) {
      const data = await alexRes.json();
      if (data.price) return parseFloat(data.price);
    }
  } catch {}

  return 1.5;
}

// ── Wallet Balance ──────────────────────────────────────

export async function fetchWalletBalance(address: string): Promise<WalletBalance> {
  try {
    const res = await fetch(
      `${HIRO_API}/extended/v1/address/${address}/balances`,
      { next: { revalidate: 30 } }
    );
    if (res.ok) {
      const data = await res.json();
      const stxBalance = parseInt(data.stx?.balance || "0") / 1_000_000;
      const stxPrice = await fetchSTXPrice();
      return { stx: stxBalance, stxUsd: stxBalance * stxPrice };
    }
  } catch {}
  return { stx: 0, stxUsd: 0 };
}

// ── Owned NFTs with IPFS Metadata ───────────────────────

export async function fetchOwnedNFTs(address: string): Promise<NFTAsset[]> {
  try {
    const res = await fetch(
      `${HIRO_API}/extended/v1/tokens/nft/holdings?principal=${address}&limit=50`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const results = data.results || [];

    const promises = results.map(async (item: any): Promise<NFTAsset | null> => {
      const assetIdentifier = item.asset_identifier || "";
      const contractId = assetIdentifier.split("::")[0];
      const tokenId = parseInt(item.value?.repr?.replace("u", "") || "0");
      const isNeuralMint = contractId === CONTRACT_ID;

      if (isNeuralMint) {
        // Fetch real IPFS metadata
        const tokenUri = await fetchTokenUri(tokenId);
        const metadata = tokenUri ? await fetchIpfsMetadata(tokenUri) : null;
        const aiModel =
          metadata?.attributes?.find((a) => a.trait_type === "AI Model")?.value ||
          (metadata?.properties?.aiModel as string) ||
          "";

        return {
          contractId,
          tokenId,
          name: metadata?.name || `NeuralMint #${tokenId}`,
          description: metadata?.description || "",
          collection: "NeuralMint",
          imageUrl: metadata?.image || "",
          owner: address,
          attributes: metadata?.attributes || [],
          aiModel,
          isNeuralMint: true,
          metadata,
        };
      } else {
        // External NFT — no IPFS resolution
        const contractName = contractId?.split(".")[1] || "Unknown";
        return {
          contractId: contractId || "",
          tokenId,
          name: `${contractName} #${tokenId}`,
          description: "",
          collection: contractName,
          imageUrl: "",
          owner: address,
          attributes: [],
          aiModel: "",
          isNeuralMint: false,
          metadata: null,
        };
      }
    });

    const settled = await Promise.allSettled(promises);
    return settled
      .filter((r): r is PromiseFulfilledResult<NFTAsset> => r.status === "fulfilled" && r.value !== null)
      .map((r) => r.value);
  } catch (e) {
    console.error("NFT fetch failed:", e);
    return [];
  }
}

// ── Collection Stats ────────────────────────────────────

export async function fetchNeuralMintStats(): Promise<CollectionStats> {
  const totalMinted = await fetchLastTokenId();
  return {
    contractId: CONTRACT_ID,
    name: NEURALMINT_COLLECTION.displayName,
    symbol: NEURALMINT_COLLECTION.symbol,
    totalMinted,
    floorPrice: 0,
    volume: 0,
  };
}

// ── Recent Activity ─────────────────────────────────────

export async function fetchRecentActivity(address: string, limit = 10): Promise<ActivityEvent[]> {
  try {
    const res = await fetch(
      `${HIRO_API}/extended/v1/address/${address}/transactions?limit=${limit}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const events: ActivityEvent[] = [];

    for (const tx of data.results || []) {
      const base = {
        txId: tx.tx_id,
        timestamp: tx.burn_block_time_iso || tx.block_time_iso || "",
        blockHeight: tx.block_height || 0,
        status: tx.tx_status || "pending",
      };

      if (tx.tx_type === "contract_call") {
        const cc = tx.contract_call || {};
        const fnName = cc.function_name || "";
        const isNeuralMint = (cc.contract_id || "").includes(NFT_CONTRACT_NAME);

        if (fnName === "mint" && isNeuralMint) {
          // Extract token ID from events
          const nftEvent = (tx.events || []).find(
            (e: any) => e.event_type === "non_fungible_token_asset"
          );
          const tokenId = nftEvent
            ? parseInt(nftEvent.asset?.value?.repr?.replace("u", "") || "0")
            : undefined;

          events.push({
            ...base,
            type: "mint",
            tokenId,
            to: tx.sender_address,
            functionName: fnName,
          });
        } else {
          events.push({
            ...base,
            type: "contract-call",
            functionName: fnName,
            from: tx.sender_address,
          });
        }
      } else if (tx.tx_type === "token_transfer") {
        const tt = tx.token_transfer || {};
        events.push({
          ...base,
          type: tt.memo?.includes?.("Generation Fee") ? "fee" : "transfer",
          from: tx.sender_address,
          to: tt.recipient_address,
          amount: parseInt(tt.amount || "0") / 1_000_000,
        });
      }
    }

    return events;
  } catch (e) {
    console.error("Activity fetch failed:", e);
    return [];
  }
}

// ── Platform Stats ──────────────────────────────────────

export async function fetchPlatformStats() {
  const stxPrice = await fetchSTXPrice();
  const collection = await fetchNeuralMintStats();

  return {
    stxPrice,
    totalMinted: collection.totalMinted,
    totalVolume: collection.volume,
    totalVolumeUsd: collection.volume * stxPrice,
    avgFloorPrice: collection.floorPrice,
    collectionsCount: 1,
    collections: [collection],
  };
}
