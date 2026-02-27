import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model, size, style } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      // Return mock data for development
      return NextResponse.json({
        success: true,
        imageUrl: `https://picsum.photos/seed/${Date.now()}/1024/1024`,
        model: model || 'dall-e-3',
        promptHash: Buffer.from(prompt).toString('hex').slice(0, 64).padEnd(64, '0'),
        mock: true,
      });
    }

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.images.generate({
      model: model || 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: size || '1024x1024',
      style: style || 'vivid',
      response_format: 'url',
    });

    const imageUrl = response.data?.[0]?.url;
    const revisedPrompt = response.data?.[0]?.revised_prompt;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 }
      );
    }

    // Create a hash of the prompt for on-chain storage
    const crypto = await import('crypto');
    const promptHash = crypto
      .createHash('sha256')
      .update(prompt)
      .digest('hex');

    return NextResponse.json({
      success: true,
      imageUrl,
      revisedPrompt,
      model: model || 'dall-e-3',
      promptHash,
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
