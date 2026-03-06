// ============================================
// NeuralMint — IPFS Resolution Utility
// ============================================

// Ordered by reliability — Cloudflare first (most reliable public gateway)
export const IPFS_GATEWAYS = [
  "https://cloudflare-ipfs.com/ipfs",
  "https://gateway.pinata.cloud/ipfs",
  "https://ipfs.io/ipfs",
  "https://dweb.link/ipfs",
  "https://w3s.link/ipfs",
] as const;

const PRIMARY_GATEWAY = IPFS_GATEWAYS[0];
const FALLBACK_GATEWAY = IPFS_GATEWAYS[2];

/**
 * Convert ipfs:// URI to an HTTPS gateway URL.
 * Handles: ipfs://{CID}, ipfs://{CID}/{path}, plain CID, https:// passthrough.
 */
export function resolveIpfsUrl(uri: string, useFallback = false): string {
  if (!uri) return "";
  if (uri.startsWith("http://") || uri.startsWith("https://")) return uri;

  let cid = uri;
  if (uri.startsWith("ipfs://")) {
    cid = uri.slice(7);
  }

  const gateway = useFallback ? FALLBACK_GATEWAY : PRIMARY_GATEWAY;
  return `${gateway}/${cid}`;
}

/**
 * Extract the IPFS CID (+ optional path) from any URL format.
 * Supports: ipfs://, gateway URLs, bare CIDs.
 */
export function extractIpfsCid(url: string): string | null {
  if (!url) return null;
  if (url.startsWith("ipfs://")) return url.slice(7);
  const match = url.match(/\/ipfs\/(.+)$/);
  if (match) return match[1];
  if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{50,})/.test(url)) return url;
  return null;
}

/**
 * Generate an array of gateway URLs for client-side fallback.
 * If the URL is not IPFS-based, returns it as-is in a single-element array.
 */
export function getGatewayUrls(imageUrl: string): string[] {
  const cid = extractIpfsCid(imageUrl);
  if (!cid) return imageUrl ? [imageUrl] : [];
  return IPFS_GATEWAYS.map((gw) => `${gw}/${cid}`);
}

/**
 * SIP-16 compatible NFT metadata.
 */
export interface SIP16Metadata {
  sip: number;
  name: string;
  description: string;
  image: string;
  imageRaw: string;
  attributes: Array<{ trait_type: string; value: string }>;
  properties: Record<string, unknown>;
}

/**
 * Fetch SIP-16 metadata from an IPFS token URI,
 * resolving the inner image field to an HTTPS gateway URL.
 * Tries Pinata gateway first, falls back to ipfs.io.
 */
export async function fetchIpfsMetadata(tokenUri: string): Promise<SIP16Metadata | null> {
  // Try Pinata first, then fallback
  for (const useFallback of [false, true]) {
    try {
      const metadataUrl = resolveIpfsUrl(tokenUri, useFallback);
      const res = await fetch(metadataUrl, {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;

      const json = await res.json();
      return {
        sip: json.sip || 16,
        name: json.name || "Untitled",
        description: json.description || "",
        image: resolveIpfsUrl(json.image || ""),
        imageRaw: json.image || "",
        attributes: json.attributes || [],
        properties: json.properties || {},
      };
    } catch {
      continue;
    }
  }

  return null;
}
