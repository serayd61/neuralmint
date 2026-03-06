import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are PromptGenius, an expert AI art prompt engineer for NeuralMint, an NFT marketplace where prompt quality determines NFT value.

Your job is to help users create the highest-quality prompts for AI image generation (DALL-E 3 or Stable Diffusion).

When a user describes their vision:
1. Generate 2-3 optimized prompt variations, each with different approaches
2. Each prompt should include: subject, style, lighting, composition, quality keywords, and artist references when appropriate
3. Make each prompt progressively more detailed and creative

Respond in this exact JSON format:
{
  "reply": "Your brief conversational response (1-2 sentences explaining your suggestions)",
  "suggestions": [
    {
      "prompt": "The full optimized prompt text",
      "score": 85,
      "tier": "epic",
      "improvements": ["Added volumetric lighting", "Specified composition style"]
    }
  ]
}

Scoring criteria (0-100):
- Specificity (0-25): Detail level, numerical details, structured format
- Technical Quality (0-25): Lighting, composition, quality keywords, render engine
- Creativity (0-25): Unique concept combinations, avoid cliches, metaphorical elements
- Artistic Direction (0-25): Style references, artist names, mood/atmosphere, medium

Tier thresholds: Legendary (95+), Epic (85-94), Rare (70-84), Common (<70)

IMPORTANT: Always respond with valid JSON only. No markdown, no code blocks.`;

function getMockResponse(userMessage: string) {
  const basePrompt = userMessage.toLowerCase();
  const suggestions = [
    {
      prompt: `${userMessage}, volumetric lighting, cinematic composition, ultra-detailed, 8K resolution, dramatic atmosphere, art by Greg Rutkowski, digital painting masterpiece`,
      score: 85,
      tier: "epic" as const,
      improvements: ["Added volumetric lighting", "Added quality keywords", "Added artist reference"],
    },
    {
      prompt: `${userMessage}, ethereal glow, subsurface scattering, octane render, hyperrealistic, moody color palette with warm tones and cool shadows, concept art, intricate details`,
      score: 79,
      tier: "rare" as const,
      improvements: ["Added render engine", "Added color palette", "Added mood"],
    },
  ];

  return {
    reply: `Great concept! I've crafted 2 optimized prompts based on "${basePrompt.slice(0, 50)}...". The first one aims for an Epic score with cinematic quality, while the second takes a more artistic approach.`,
    suggestions,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    // If no OpenAI key, return mock response
    if (!process.env.OPENAI_API_KEY) {
      const lastUserMsg = messages.filter((m: { role: string }) => m.role === "user").pop();
      const mockData = getMockResponse(lastUserMsg?.content || "create an NFT");
      return NextResponse.json(mockData);
    }

    try {
      const systemMessage = {
        role: "system",
        content: SYSTEM_PROMPT + `\n\nTarget AI model: ${model || "dall-e-3"}`,
      };

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            systemMessage,
            ...messages.slice(-6), // Keep last 6 messages for context
          ],
          temperature: 0.9,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        console.error("PromptBot OpenAI error:", await response.text());
        const lastUserMsg = messages.filter((m: { role: string }) => m.role === "user").pop();
        return NextResponse.json(getMockResponse(lastUserMsg?.content || "create an NFT"));
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        const lastUserMsg = messages.filter((m: { role: string }) => m.role === "user").pop();
        return NextResponse.json(getMockResponse(lastUserMsg?.content || "create an NFT"));
      }

      // Try to parse JSON response
      try {
        const parsed = JSON.parse(content);
        return NextResponse.json({
          reply: parsed.reply || "Here are some prompt suggestions:",
          suggestions: (parsed.suggestions || []).map((s: { prompt: string; score: number; tier: string; improvements: string[] }) => ({
            prompt: s.prompt || "",
            score: Math.min(100, Math.max(0, s.score || 70)),
            tier: s.tier || "rare",
            improvements: s.improvements || [],
          })),
        });
      } catch {
        // If JSON parsing fails, return the content as a reply with no suggestions
        return NextResponse.json({
          reply: content,
          suggestions: [],
        });
      }
    } catch (err) {
      console.error("PromptBot error:", err);
      const lastUserMsg = messages.filter((m: { role: string }) => m.role === "user").pop();
      return NextResponse.json(getMockResponse(lastUserMsg?.content || "create an NFT"));
    }
  } catch (error) {
    console.error("PromptBot route error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
