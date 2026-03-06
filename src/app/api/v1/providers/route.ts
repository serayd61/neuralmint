import { NextResponse } from "next/server";

export async function GET() {
  const hasOllama = !!process.env.OLLAMA_API_URL || !!process.env.OPENCLAW_API_URL;
  const hasHF = !!process.env.HUGGINGFACE_API_TOKEN;

  return NextResponse.json({
    openai: !!process.env.OPENAI_API_KEY,
    openclaw: hasOllama || hasHF,
    stableDiffusion: hasHF,
  });
}
