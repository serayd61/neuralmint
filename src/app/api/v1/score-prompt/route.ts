import { NextRequest, NextResponse } from "next/server";
import { scorePrompt } from "@/lib/prompt-scoring";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, aiModel } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const breakdown = scorePrompt(prompt, aiModel || "dall-e-3");
    return NextResponse.json(breakdown);
  } catch (error) {
    console.error("Score prompt error:", error);
    return NextResponse.json({ error: "Failed to score prompt" }, { status: 500 });
  }
}
