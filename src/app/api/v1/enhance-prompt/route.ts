import { NextRequest, NextResponse } from "next/server";
import { enhancePrompt } from "@/lib/ai-providers";
import type { AIProvider } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, provider } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const aiProvider: AIProvider = provider === "openclaw" ? "openclaw" : "openai";
    const result = await enhancePrompt(aiProvider, prompt);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Enhance prompt error:", error);
    return NextResponse.json(
      { error: "Failed to enhance prompt" },
      { status: 500 }
    );
  }
}
