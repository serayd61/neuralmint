import { NextRequest, NextResponse } from 'next/server';

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

    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecret = process.env.PINATA_SECRET_API_KEY;

    // If Pinata is configured, upload for real
    if (pinataApiKey && pinataSecret) {
      try {
        // 1. Fetch the image from the URL
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error('Failed to fetch image');
        }
        const imageBlob = await imageResponse.blob();

        // 2. Upload image to Pinata
        const imageFormData = new FormData();
        imageFormData.append('file', imageBlob, `${name || 'neuralmint-nft'}.png`);
        imageFormData.append('pinataMetadata', JSON.stringify({
          name: `${name || 'NeuralMint NFT'} - Image`,
        }));

        const imageUploadRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          headers: {
            'pinata_api_key': pinataApiKey,
            'pinata_secret_api_key': pinataSecret,
          },
          body: imageFormData,
        });

        if (!imageUploadRes.ok) {
          const err = await imageUploadRes.text();
          console.error('Pinata image upload error:', err);
          throw new Error('Image upload to IPFS failed');
        }

        const imageData = await imageUploadRes.json();
        const imageCid = imageData.IpfsHash;

        // 3. Create SIP-016 compatible metadata
        const metadata = {
          sip: 16,
          name: name || 'NeuralMint NFT',
          description: description || 'AI-generated NFT on Stacks',
          image: `ipfs://${imageCid}`,
          attributes: attributes || [],
          properties: {
            aiModel: aiMetadata?.model || 'dall-e-3',
            promptHash: aiMetadata?.promptHash || '',
            generatedAt: new Date().toISOString(),
            platform: 'NeuralMint',
          },
        };

        // 4. Upload metadata to Pinata
        const metadataRes = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': pinataApiKey,
            'pinata_secret_api_key': pinataSecret,
          },
          body: JSON.stringify({
            pinataContent: metadata,
            pinataMetadata: {
              name: `${name || 'NeuralMint NFT'} - Metadata`,
            },
          }),
        });

        if (!metadataRes.ok) {
          const err = await metadataRes.text();
          console.error('Pinata metadata upload error:', err);
          throw new Error('Metadata upload to IPFS failed');
        }

        const metadataData = await metadataRes.json();
        const metadataCid = metadataData.IpfsHash;

        return NextResponse.json({
          success: true,
          imageCid,
          metadataCid,
          imageUri: `ipfs://${imageCid}`,
          metadataUri: `ipfs://${metadataCid}`,
          gateway: {
            image: `https://gateway.pinata.cloud/ipfs/${imageCid}`,
            metadata: `https://gateway.pinata.cloud/ipfs/${metadataCid}`,
          },
        });
      } catch (pinataError) {
        console.error('Pinata upload error:', pinataError);
        // Fall through to mock if Pinata fails
      }
    }

    // Mock fallback for development
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

    const metadataCid = `Qm${Buffer.from(JSON.stringify(metadata)).toString('base64').slice(0, 44)}`;

    return NextResponse.json({
      success: true,
      mock: true,
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
