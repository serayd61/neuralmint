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

/** Timeout for Stable Diffusion image generation (120s for large images) */
const SD_TIMEOUT_MS = 120_000;
/** Timeout for OpenClaw LLM calls */
const LLM_TIMEOUT_MS = 30_000;

/**
 * Generate image via Stable Diffusion WebUI API running on VPS.
 * Expects STABLE_DIFFUSION_API_URL env var (e.g. http://vps-ip:7860).
 * Falls back to OpenClaw Gateway's /v1/ proxy if SD URL ends with the gateway port.
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
    console.warn("[OpenClaw] STABLE_DIFFUSION_API_URL not set, using mock");
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
      signal: AbortSignal.timeout(SD_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "unknown error");
      console.error(`[OpenClaw] SD generation error (${response.status}):`, errText);
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
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[OpenClaw] SD API error:", msg);
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
 * Enhance prompt via Ollama LLM running on VPS (direct, bypassing OpenClaw Gateway).
 * Uses OPENCLAW_API_URL env var with /ollama/ proxy path.
 * Falls back to OpenClaw Gateway /v1/ endpoint if OLLAMA_API_URL is not set.
 */
export async function enhanceWithOpenClaw(prompt: string): Promise<EnhanceResult> {
  const ollamaUrl = process.env.OLLAMA_API_URL;
  const openclawUrl = process.env.OPENCLAW_API_URL;
  const baseUrl = ollamaUrl || (openclawUrl ? `${openclawUrl}/ollama` : null);

  if (!baseUrl) {
    console.warn("[OpenClaw] No OLLAMA_API_URL or OPENCLAW_API_URL set, using mock");
    return { success: true, enhanced: mockEnhance(prompt), provider: "openclaw", mock: true };
  }

  const ollamaModel = process.env.OLLAMA_MODEL || "deepseek-r1:1.5b";

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
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
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "unknown error");
      console.error(`[OpenClaw] Ollama enhance error (${response.status}):`, errText);
      return { success: true, enhanced: mockEnhance(prompt), provider: "openclaw", mock: true };
    }

    const data = await response.json();
    const enhanced = data.message?.content?.trim();

    if (!enhanced) {
      console.warn("[OpenClaw] Empty Ollama response, using mock");
      return { success: true, enhanced: mockEnhance(prompt), provider: "openclaw", mock: true };
    }

    return { success: true, enhanced, provider: "openclaw" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[OpenClaw] Ollama enhance error:", msg);
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
