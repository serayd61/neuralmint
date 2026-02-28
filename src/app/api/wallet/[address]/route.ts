import { NextRequest, NextResponse } from "next/server";
import { 
  fetchWalletBalance, 
  fetchOwnedNFTs, 
  fetchRecentTransactions 
} from "@/lib/blockchain-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  
  if (!address || !address.startsWith("SP")) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const [balance, nfts, transactions] = await Promise.all([
      fetchWalletBalance(address),
      fetchOwnedNFTs(address),
      fetchRecentTransactions(address, 5),
    ]);

    return NextResponse.json({
      address,
      balance,
      nfts,
      nftCount: nfts.length,
      recentTransactions: transactions.slice(0, 5),
    });
  } catch (error) {
    console.error("Wallet API error:", error);
    return NextResponse.json({ error: "Failed to fetch wallet data" }, { status: 500 });
  }
}
