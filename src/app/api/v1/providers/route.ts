import { NextResponse } from "next/server";

export async function GET() {
  const hasOllama = !!process.env.OLLAMA_API_URL || !!process.env.OPENCLAW_API_URL;

  return NextResponse.json({
    openai: !!process.env.OPENAI_API_KEY,
    openclaw: hasOllama,
    stableDiffusion: !!process.env.STABLE_DIFFUSION_API_URL,
  });
}
