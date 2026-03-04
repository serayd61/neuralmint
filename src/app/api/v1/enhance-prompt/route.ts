import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      // Mock enhancement for development
      return NextResponse.json({
        success: true,
        enhanced: `${prompt}, masterpiece, ultra-detailed, volumetric lighting, 8K resolution, cinematic composition, dramatic shadows, professional digital art`,
        mock: true,
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI art prompt engineer. Enhance the user\'s prompt to create stunning NFT artwork. Add artistic details like lighting, composition, style references, and mood. Keep it under 200 words. Return ONLY the enhanced prompt, nothing else.',
          },
          {
            role: 'user',
            content: `Enhance this NFT art prompt: "${prompt}"`,
          },
        ],
        temperature: 0.8,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI enhance error:', await response.text());
      // Fallback to simple enhancement
      return NextResponse.json({
        success: true,
        enhanced: `${prompt}, masterpiece, ultra-detailed, volumetric lighting, 8K resolution, cinematic composition`,
        mock: true,
      });
    }

    const data = await response.json();
    const enhanced = data.choices?.[0]?.message?.content?.trim();

    if (!enhanced) {
      return NextResponse.json(
        { error: 'Enhancement failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enhanced,
    });
  } catch (error) {
    console.error('Enhance prompt error:', error);
    return NextResponse.json(
      { error: 'Failed to enhance prompt' },
      { status: 500 }
    );
  }
}
