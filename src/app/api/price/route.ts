import { NextResponse } from "next/server";
import { fetchSTXPrice } from "@/lib/blockchain-service";

export async function GET() {
  try {
    const price = await fetchSTXPrice();
    
    return NextResponse.json({
      symbol: "STX",
      price,
      currency: "USD",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Price API error:", error);
    return NextResponse.json({ error: "Failed to fetch price" }, { status: 500 });
  }
}
