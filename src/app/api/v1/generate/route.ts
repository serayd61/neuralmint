import { NextRequest, NextResponse } from "next/server";
import { verifyPayment } from "@/lib/fee-service";
import { generateImage } from "@/lib/ai-providers";
import { AI_MODELS } from "@/lib/constants";
import type { AIProvider } from "@/lib/constants";

// Track used transaction IDs to prevent double-spend
const usedTxIds = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model, size, style, txId, provider } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Determine provider type
    const aiProvider: AIProvider = provider === "openclaw" ? "openclaw" : "openai";

    // Find model config to get expected fee
    const modelConfig = AI_MODELS.find((m) => m.id === model);
    const expectedFee = modelConfig?.fee ?? 2.0;

    // Payment verification gate
    if (!txId) {
      return NextResponse.json(
        { error: "Payment transaction ID required. Please pay the generation fee first." },
        { status: 402 }
      );
    }

    if (usedTxIds.has(txId)) {
      return NextResponse.json(
        { error: "This transaction has already been used for a generation." },
        { status: 409 }
      );
    }

    const verification = await verifyPayment(txId, expectedFee);
    if (!verification.valid) {
      return NextResponse.json(
        { error: `Payment verification failed: ${verification.error}` },
        { status: 402 }
      );
    }

    // Mark txId as used
    usedTxIds.add(txId);

    // Generate image with the selected provider
    const result = await generateImage(aiProvider, prompt, model, size, style);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
