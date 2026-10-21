// app/api/markets/route.js
// ─────────────────────────────────────────────────────────────
//  GET /api/markets?page=1&limit=8
//  Returns paginated asset list + total count
// ─────────────────────────────────────────────────────────────
import { getMarketAssets, getAssetCount } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page  = parseInt(searchParams.get('page')  ?? '1',  10);
  const limit = parseInt(searchParams.get('limit') ?? '8',  10);

  try {
    const [assets, total] = await Promise.all([
      getMarketAssets({ page, limit }),
      getAssetCount(),
    ]);

    return NextResponse.json({
      data:       assets,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
