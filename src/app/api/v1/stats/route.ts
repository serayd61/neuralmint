import { NextResponse } from "next/server";
import { fetchPlatformStats } from "@/lib/blockchain-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const stats = await fetchPlatformStats();
    return NextResponse.json({
      totalNftsMinted: stats.totalMinted,
      totalVolumeStx: stats.totalVolume,
      activeCreators: stats.collectionsCount,
      floorPriceStx: stats.avgFloorPrice,
      stxPriceUsd: stats.stxPrice,
      collections: stats.collections,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json({
      totalNftsMinted: 0,
      totalVolumeStx: 0,
      activeCreators: 0,
      floorPriceStx: 0,
      stxPriceUsd: 0,
      updatedAt: new Date().toISOString(),
    });
  }
}
