import { NextRequest, NextResponse } from 'next/server';
import { STACKS_API_URL, MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_NAME } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'active';

    if (!MARKETPLACE_CONTRACT_ADDRESS) {
      // Return mock data if contract not deployed
      return NextResponse.json({
        success: true,
        listings: [],
        total: 0,
        page,
        limit,
        mock: true,
      });
    }

    // Fetch listings from contract read-only functions
    // In production, you'd index these events in a database
    const contractId = `${MARKETPLACE_CONTRACT_ADDRESS}.${MARKETPLACE_CONTRACT_NAME}`;
    
    // For now, return empty array - in production you'd query indexed data
    return NextResponse.json({
      success: true,
      listings: [],
      total: 0,
      page,
      limit,
      contractId,
    });
  } catch (error) {
    console.error('Listings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}
