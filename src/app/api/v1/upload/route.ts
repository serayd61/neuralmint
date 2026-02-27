import { NextRequest, NextResponse } from 'next/server';

// This endpoint handles uploading generated images to IPFS
// In production, you'd use Pinata, NFT.Storage, or similar

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, name, description, attributes, aiMetadata } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // For development, return a mock IPFS URI
    // In production, upload to IPFS via Pinata or NFT.Storage
    const mockCid = `Qm${Buffer.from(imageUrl + Date.now()).toString('base64').slice(0, 44)}`;
    
    const metadata = {
      name: name || 'NeuralMint NFT',
      description: description || 'AI-generated NFT on Stacks',
      image: `ipfs://${mockCid}`,
      attributes: attributes || [],
      properties: {
        aiModel: aiMetadata?.model || 'dall-e-3',
        promptHash: aiMetadata?.promptHash || '',
        generatedAt: new Date().toISOString(),
        platform: 'NeuralMint',
      },
    };

    // Mock metadata CID
    const metadataCid = `Qm${Buffer.from(JSON.stringify(metadata)).toString('base64').slice(0, 44)}`;

    return NextResponse.json({
      success: true,
      imageCid: mockCid,
      metadataCid,
      imageUri: `ipfs://${mockCid}`,
      metadataUri: `ipfs://${metadataCid}`,
      gateway: {
        image: `https://ipfs.io/ipfs/${mockCid}`,
        metadata: `https://ipfs.io/ipfs/${metadataCid}`,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload to IPFS' },
      { status: 500 }
    );
  }
}
