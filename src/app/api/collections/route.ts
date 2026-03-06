import { NextResponse } from "next/server";
import { fetchNeuralMintStats, fetchSTXPrice } from "@/lib/blockchain-service";

export async function GET() {
  try {
    const [collection, stxPrice] = await Promise.all([
      fetchNeuralMintStats(),
      fetchSTXPrice(),
    ]);

    return NextResponse.json({
      collections: [collection],
      stxPrice,
      totalCollections: 1,
    });
  } catch (error) {
    console.error("Collections API error:", error);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}
