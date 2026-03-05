import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    openai: !!process.env.OPENAI_API_KEY,
    openclaw: !!process.env.OPENCLAW_API_URL && !!process.env.OPENCLAW_API_TOKEN,
    stableDiffusion: !!process.env.STABLE_DIFFUSION_API_URL,
  });
}
