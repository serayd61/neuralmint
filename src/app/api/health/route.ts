import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "neuralmint-web",
    timestamp: new Date().toISOString(),
    network: process.env.NEXT_PUBLIC_STACKS_NETWORK ?? "testnet",
  });
}
