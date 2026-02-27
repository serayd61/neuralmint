import { NextResponse } from "next/server";
import { platformStats } from "@/lib/mock-data";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    totalNftsMinted: platformStats.totalNftsMinted,
    totalVolumeStx: platformStats.totalVolumeStx,
    activeCreators: platformStats.activeCreators,
    floorPriceStx: platformStats.floorPriceStx,
    stxPriceUsd: platformStats.stxPriceUsd,
    updatedAt: new Date().toISOString(),
  });
}
