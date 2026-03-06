import { NextRequest, NextResponse } from "next/server";
import { getPromptTier } from "@/lib/prompt-utils";
import { scorePrompt as clientScorePrompt } from "@/lib/prompt-scoring";
import crypto from "crypto";

// Rate limiting: IP -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 10 requests per minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { prompt, aiModel } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (prompt.trim().length < 5) {
      return NextResponse.json({ error: "Prompt must be at least 5 characters" }, { status: 400 });
    }

    // Calculate SHA-256 hash for on-chain verification
    const promptHash = crypto.createHash("sha256").update(prompt.trim()).digest("hex");

    // Try GPT-4o-mini scoring first, fall back to client-side scoring
    const openaiKey = process.env.OPENAI_API_KEY;

    if (openaiKey) {
      try {
        const aiResult = await scoreWithGPT(prompt.trim(), aiModel || "dall-e-3", openaiKey);
        return NextResponse.json({
          ...aiResult,
          promptHash,
          rarity_tier: getPromptTier(aiResult.score),
        });
      } catch (err) {
        console.error("GPT scoring failed, falling back to client-side:", err);
      }
    }

    // Fallback: client-side keyword scoring
    const breakdown = clientScorePrompt(prompt, aiModel || "dall-e-3");
    const tier = getPromptTier(breakdown.overall);

    return NextResponse.json({
      score: breakdown.overall,
      breakdown: {
        originality: breakdown.specificity,
        creativity: breakdown.creativity,
        technical: breakdown.technicalQuality,
        market: breakdown.artisticDirection,
      },
      feedback: generateFallbackFeedback(breakdown.overall),
      rarity_tier: tier,
      suggestions: generateFallbackSuggestions(breakdown),
      promptHash,
    });
  } catch (error) {
    console.error("Score prompt error:", error);
    return NextResponse.json({ error: "Failed to score prompt" }, { status: 500 });
  }
}

async function scoreWithGPT(
  prompt: string,
  aiModel: string,
  apiKey: string
): Promise<{
  score: number;
  breakdown: { originality: number; creativity: number; technical: number; market: number };
  feedback: string;
  suggestions: string[];
}> {
  const systemPrompt = `You are an expert AI art prompt evaluator for an NFT marketplace called NeuralMint.
Evaluate the given prompt for AI image generation (${aiModel}) across 4 criteria, each scored 0-25:

1. **Originality (0-25)**: How unique and non-cliché is the prompt? Does it combine unexpected concepts? Avoid generic descriptions.
2. **Creativity (0-25)**: Depth of imagination, abstract thinking, narrative elements, metaphorical combinations, dynamic action.
3. **Technical Quality (0-25)**: Structural quality for AI image generation — lighting directives, composition terms, quality keywords, render engine references, camera angles.
4. **Market Potential (0-25)**: NFT market trend alignment, collectibility, visual appeal potential, uniqueness that drives value.

Respond ONLY with valid JSON in this exact format:
{
  "originality": <number 0-25>,
  "creativity": <number 0-25>,
  "technical": <number 0-25>,
  "market": <number 0-25>,
  "feedback": "<1-2 sentences of actionable feedback on how to improve the prompt>",
  "suggestions": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Evaluate this prompt:\n\n"${prompt}"` },
      ],
      temperature: 0.3,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error("Empty GPT response");

  // Parse JSON from response (handle potential markdown code blocks)
  const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(jsonStr);

  const originality = Math.max(0, Math.min(25, Math.round(parsed.originality || 0)));
  const creativity = Math.max(0, Math.min(25, Math.round(parsed.creativity || 0)));
  const technical = Math.max(0, Math.min(25, Math.round(parsed.technical || 0)));
  const market = Math.max(0, Math.min(25, Math.round(parsed.market || 0)));
  const score = originality + creativity + technical + market;

  return {
    score,
    breakdown: { originality, creativity, technical, market },
    feedback: parsed.feedback || "",
    suggestions: (parsed.suggestions || []).slice(0, 3),
  };
}

function generateFallbackFeedback(score: number): string {
  if (score >= 81) return "Excellent prompt! High potential for a valuable NFT.";
  if (score >= 61) return "Strong prompt with good detail. Add more unique visual elements to push into Legendary tier.";
  if (score >= 41) return "Decent prompt. Try adding lighting, composition, and style references for higher scores.";
  if (score >= 21) return "Basic prompt. Add more descriptive details, artistic style, and technical keywords.";
  return "Very basic prompt. Include subject, style, lighting, composition, and mood for better results.";
}

function generateFallbackSuggestions(breakdown: {
  specificity: number;
  technicalQuality: number;
  creativity: number;
  artisticDirection: number;
}): string[] {
  const suggestions: string[] = [];
  if (breakdown.specificity < 15) suggestions.push("Add more specific details: colors, textures, materials");
  if (breakdown.technicalQuality < 15) suggestions.push("Include technical terms: lighting, composition, render engine");
  if (breakdown.creativity < 15) suggestions.push("Combine unexpected concepts or add narrative elements");
  if (breakdown.artisticDirection < 15) suggestions.push("Reference art styles, movements, or specific artists");
  if (suggestions.length < 3) suggestions.push("Try adding mood/atmosphere keywords like ethereal, moody, cosmic");
  return suggestions.slice(0, 3);
}
