import { NextResponse } from "next/server";

/**
 * Health check for OpenClaw stack:
 * - Ollama (LLM prompt enhance) on VPS
 * - Hugging Face Inference API (SDXL image generation)
 */
export async function GET() {
  const ollamaUrl = process.env.OLLAMA_API_URL;
  const hfToken = process.env.HUGGINGFACE_API_TOKEN;

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    ollama: { configured: false, reachable: false },
    huggingface: { configured: false, reachable: false },
  };

  // Test Ollama LLM
  if (ollamaUrl) {
    results.ollama = { configured: true, reachable: false, url: ollamaUrl };
    try {
      const res = await fetch(`${ollamaUrl}/api/tags`, {
        signal: AbortSignal.timeout(10_000),
      });

      if (res.ok) {
        const data = await res.json();
        const models = data.models?.map((m: { name: string }) => m.name) ?? [];
        results.ollama = { configured: true, reachable: true, url: ollamaUrl, models };
      } else {
        results.ollama = { configured: true, reachable: false, status: res.status, url: ollamaUrl };
      }
    } catch (err) {
      (results.ollama as Record<string, unknown>).error =
        err instanceof Error ? err.message : "Connection failed";
    }
  }

  // Test Hugging Face API token
  if (hfToken) {
    results.huggingface = { configured: true, reachable: false };
    try {
      const res = await fetch("https://huggingface.co/api/whoami-v2", {
        headers: { Authorization: `Bearer ${hfToken}` },
        signal: AbortSignal.timeout(10_000),
      });

      results.huggingface = {
        configured: true,
        reachable: res.ok,
        status: res.status,
      };
    } catch (err) {
      (results.huggingface as Record<string, unknown>).error =
        err instanceof Error ? err.message : "Connection failed";
    }
  }

  const allHealthy =
    (results.ollama as Record<string, unknown>).reachable ||
    (results.huggingface as Record<string, unknown>).reachable;

  return NextResponse.json(results, { status: allHealthy ? 200 : 503 });
}
