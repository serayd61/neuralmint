import { NextResponse } from "next/server";

/**
 * Health check for OpenClaw Gateway connectivity.
 * Tests both the Gateway (LLM) and Stable Diffusion (image gen) endpoints.
 */
export async function GET() {
  const openclawUrl = process.env.OPENCLAW_API_URL;
  const openclawToken = process.env.OPENCLAW_API_TOKEN;
  const sdUrl = process.env.STABLE_DIFFUSION_API_URL;

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    gateway: { configured: false, reachable: false },
    stableDiffusion: { configured: false, reachable: false },
  };

  // Test OpenClaw Gateway
  if (openclawUrl && openclawToken) {
    results.gateway = { configured: true, reachable: false, url: openclawUrl };
    try {
      const res = await fetch(`${openclawUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openclawToken}`,
        },
        body: JSON.stringify({
          model: `openclaw:${process.env.OPENCLAW_AGENT_ID || "main"}`,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      results.gateway = {
        configured: true,
        reachable: res.ok,
        status: res.status,
        url: openclawUrl,
      };

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        (results.gateway as Record<string, unknown>).error = text.slice(0, 200);
      }
    } catch (err) {
      (results.gateway as Record<string, unknown>).error =
        err instanceof Error ? err.message : "Connection failed";
    }
  }

  // Test Stable Diffusion WebUI
  if (sdUrl) {
    results.stableDiffusion = { configured: true, reachable: false, url: sdUrl };
    try {
      const res = await fetch(`${sdUrl}/sdapi/v1/options`, {
        signal: AbortSignal.timeout(10_000),
      });

      results.stableDiffusion = {
        configured: true,
        reachable: res.ok,
        status: res.status,
        url: sdUrl,
      };

      if (res.ok) {
        const data = await res.json();
        (results.stableDiffusion as Record<string, unknown>).model =
          data.sd_model_checkpoint || "unknown";
      }
    } catch (err) {
      (results.stableDiffusion as Record<string, unknown>).error =
        err instanceof Error ? err.message : "Connection failed";
    }
  }

  const allHealthy =
    (results.gateway as Record<string, unknown>).reachable ||
    (results.stableDiffusion as Record<string, unknown>).reachable;

  return NextResponse.json(results, { status: allHealthy ? 200 : 503 });
}
