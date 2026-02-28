import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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

    // Create a hash of the prompt for on-chain storage
    const promptHash = crypto
      .createHash('sha256')
      .update(prompt)
      .digest('hex');

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      // Return mock data for development/demo
      const seed = promptHash.slice(0, 8);
      return NextResponse.json({
        success: true,
        imageUrl: `https://picsum.photos/seed/${seed}/1024/1024`,
        model: model || 'dall-e-3',
        promptHash,
        mock: true,
      });
    }

    // If OpenAI is configured, make the API call
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: model || 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: size || '1024x1024',
          style: style || 'vivid',
          response_format: 'url',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenAI error:', error);
        // Fallback to mock on error
        const seed = promptHash.slice(0, 8);
        return NextResponse.json({
          success: true,
          imageUrl: `https://picsum.photos/seed/${seed}/1024/1024`,
          model: model || 'dall-e-3',
          promptHash,
          mock: true,
        });
      }

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;
      const revisedPrompt = data.data?.[0]?.revised_prompt;

      if (!imageUrl) {
        return NextResponse.json(
          { error: 'Failed to generate image' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        imageUrl,
        revisedPrompt,
        model: model || 'dall-e-3',
        promptHash,
      });
    } catch (apiError) {
      console.error('OpenAI API error:', apiError);
      // Fallback to mock
      const seed = promptHash.slice(0, 8);
      return NextResponse.json({
        success: true,
        imageUrl: `https://picsum.photos/seed/${seed}/1024/1024`,
        model: model || 'dall-e-3',
        promptHash,
        mock: true,
      });
    }
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
