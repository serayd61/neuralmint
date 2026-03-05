import crypto from "crypto";
import type { AIProvider } from "./constants";

export interface GenerationResult {
  success: boolean;
  imageUrl: string;
  revisedPrompt?: string;
  model: string;
  promptHash: string;
  provider: AIProvider;
  mock?: boolean;
}

export interface EnhanceResult {
  success: boolean;
  enhanced: string;
  provider: AIProvider;
  mock?: boolean;
}

// -- Prompt hash utility --

export function createPromptHash(prompt: string): string {
  return crypto.createHash("sha256").update(prompt).digest("hex");
}

// -- Mock fallback (development / missing keys) --

function mockImageUrl(promptHash: string): string {
  const seed = promptHash.slice(0, 8);
  return `https://picsum.photos/seed/${seed}/1024/1024`;
}

function mockEnhance(prompt: string): string {
  return `${prompt}, masterpiece, ultra-detailed, volumetric lighting, 8K resolution, cinematic composition, dramatic shadows, professional digital art`;
}

// =============================================================
// OpenAI Provider
// =============================================================

export async function generateWithOpenAI(
  prompt: string,
  model: string,
  size: string,
  style: string
): Promise<GenerationResult> {
  const promptHash = createPromptHash(prompt);

  if (!process.env.OPENAI_API_KEY) {
    return {
      success: true,
      imageUrl: mockImageUrl(promptHash),
      model: model || "dall-e-3",
      promptHash,
      provider: "openai",
      mock: true,
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || "dall-e-3",
        prompt,
        n: 1,
        size: size || "1024x1024",
        style: style || "vivid",
        response_format: "url",
      }),
    });

    if (!response.ok) {
      console.error("OpenAI generation error:", await response.text());
      return {
        success: true,
        imageUrl: mockImageUrl(promptHash),
        model: model || "dall-e-3",
        promptHash,
        provider: "openai",
        mock: true,
      };
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;
    const revisedPrompt = data.data?.[0]?.revised_prompt;

    if (!imageUrl) {
      throw new Error("No image URL in response");
    }

    return {
      success: true,
      imageUrl,
      revisedPrompt,
      model: model || "dall-e-3",
      promptHash,
      provider: "openai",
    };
  } catch (err) {
    console.error("OpenAI API error:", err);
    return {
      success: true,
      imageUrl: mockImageUrl(promptHash),
      model: model || "dall-e-3",
      promptHash,
      provider: "openai",
      mock: true,
    };
  }
}

export async function enhanceWithOpenAI(prompt: string): Promise<EnhanceResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { success: true, enhanced: mockEnhance(prompt), provider: "openai", mock: true };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert AI art prompt engineer. Enhance the user's prompt to create stunning NFT artwork. Add artistic details like lighting, composition, style references, and mood. Keep it under 200 words. Return ONLY the enhanced prompt, nothing else.",
          },
          {
            role: "user",
            content: `Enhance this NFT art prompt: "${prompt}"`,
          },
        ],
        temperature: 0.8,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI enhance error:", await response.text());
      return { success: true, enhanced: mockEnhance(prompt), provider: "openai", mock: true };
    }

    const data = await response.json();
    const enhanced = data.choices?.[0]?.message?.content?.trim();

    if (!enhanced) {
      return { success: true, enhanced: mockEnhance(prompt), provider: "openai", mock: true };
    }

    return { success: true, enhanced, provider: "openai" };
  } catch (err) {
    console.error("OpenAI enhance error:", err);
    return { success: true, enhanced: mockEnhance(prompt), provider: "openai", mock: true };
  }
}

// =============================================================
// OpenClaw Provider (Self-hosted: Ollama + Stable Diffusion)
// =============================================================

/**
 * Generate image via Stable Diffusion WebUI API running on VPS.
 * Expects STABLE_DIFFUSION_API_URL env var (e.g. http://vps-ip:7860).
 */
export async function generateWithOpenClaw(
  prompt: string,
  _model: string,
  size: string,
  _style: string
): Promise<GenerationResult> {
  const promptHash = createPromptHash(prompt);
  const sdUrl = process.env.STABLE_DIFFUSION_API_URL;

  if (!sdUrl) {
    return {
      success: true,
      imageUrl: mockImageUrl(promptHash),
      model: "sdxl",
      promptHash,
      provider: "openclaw",
      mock: true,
    };
  }

  try {
    const [width, height] = (size || "1024x1024").split("x").map(Number);

    const response = await fetch(`${sdUrl}/sdapi/v1/txt2img`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `${prompt}, masterpiece, best quality, highly detailed`,
        negative_prompt:
          "lowres, bad anatomy, bad hands, text, error, missing fingers, cropped, worst quality, low quality, jpeg artifacts, blurry",
        width: width || 1024,
        height: height || 1024,
        steps: 30,
        cfg_scale: 7,
        sampler_name: "DPM++ 2M Karras",
      }),
    });

    if (!response.ok) {
      console.error("Stable Diffusion error:", await response.text());
      return {
        success: true,
        imageUrl: mockImageUrl(promptHash),
        model: "sdxl",
        promptHash,
        provider: "openclaw",
        mock: true,
      };
    }

    const data = await response.json();
    const base64Image = data.images?.[0];

    if (!base64Image) {
      throw new Error("No image in Stable Diffusion response");
    }

    // Return as data URI — frontend can display directly,
    // and the upload route handles converting to IPFS later.
    const imageUrl = `data:image/png;base64,${base64Image}`;

    return {
      success: true,
      imageUrl,
      model: "sdxl",
      promptHash,
      provider: "openclaw",
    };
  } catch (err) {
    console.error("Stable Diffusion API error:", err);
    return {
      success: true,
      imageUrl: mockImageUrl(promptHash),
      model: "sdxl",
      promptHash,
      provider: "openclaw",
      mock: true,
    };
  }
}

/**
 * Enhance prompt via OpenClaw Gateway (Ollama LLM on VPS).
 * Expects OPENCLAW_API_URL and OPENCLAW_API_TOKEN env vars.
 */
export async function enhanceWithOpenClaw(prompt: string): Promise<EnhanceResult> {
  const openclawUrl = process.env.OPENCLAW_API_URL;
  const openclawToken = process.env.OPENCLAW_API_TOKEN;

  if (!openclawUrl || !openclawToken) {
    return { success: true, enhanced: mockEnhance(prompt), provider: "openclaw", mock: true };
  }

  try {
    const agentId = process.env.OPENCLAW_AGENT_ID || "main";

    const response = await fetch(`${openclawUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openclawToken}`,
        "x-openclaw-agent-id": agentId,
      },
      body: JSON.stringify({
        model: `openclaw:${agentId}`,
        messages: [
          {
            role: "system",
            content:
              "You are an expert AI art prompt engineer. Enhance the user's prompt to create stunning NFT artwork. Add artistic details like lighting, composition, style references, and mood. Keep it under 200 words. Return ONLY the enhanced prompt, nothing else.",
          },
          {
            role: "user",
            content: `Enhance this NFT art prompt: "${prompt}"`,
          },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error("OpenClaw enhance error:", await response.text());
      return { success: true, enhanced: mockEnhance(prompt), provider: "openclaw", mock: true };
    }

    const data = await response.json();
    const enhanced = data.choices?.[0]?.message?.content?.trim();

    if (!enhanced) {
      return { success: true, enhanced: mockEnhance(prompt), provider: "openclaw", mock: true };
    }

    return { success: true, enhanced, provider: "openclaw" };
  } catch (err) {
    console.error("OpenClaw enhance error:", err);
    return { success: true, enhanced: mockEnhance(prompt), provider: "openclaw", mock: true };
  }
}

// =============================================================
// Unified dispatcher
// =============================================================

export async function generateImage(
  provider: AIProvider,
  prompt: string,
  model: string,
  size: string,
  style: string
): Promise<GenerationResult> {
  if (provider === "openclaw") {
    return generateWithOpenClaw(prompt, model, size, style);
  }
  return generateWithOpenAI(prompt, model, size, style);
}

export async function enhancePrompt(
  provider: AIProvider,
  prompt: string
): Promise<EnhanceResult> {
  if (provider === "openclaw") {
    return enhanceWithOpenClaw(prompt);
  }
  return enhanceWithOpenAI(prompt);
}
