import { NextResponse } from "next/server";
import { fetchAllCollectionsStats, fetchSTXPrice } from "@/lib/blockchain-service";

export async function GET() {
  try {
    const [collections, stxPrice] = await Promise.all([
      fetchAllCollectionsStats(),
      fetchSTXPrice(),
    ]);

    return NextResponse.json({
      collections,
      stxPrice,
      totalCollections: collections.length,
    });
  } catch (error) {
    console.error("Collections API error:", error);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}
