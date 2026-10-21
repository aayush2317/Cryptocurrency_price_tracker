// app/api/star/route.js
// ─────────────────────────────────────────────────────────────
//  POST /api/star   body: { userId, assetId }
//  Toggles the ☆ star on an asset
// ─────────────────────────────────────────────────────────────
import { toggleStarAsset } from '@/lib/db';
import { NextResponse }    from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { userId, assetId } = await request.json();
    if (!userId || !assetId)
      return NextResponse.json({ error: 'userId and assetId required' }, { status: 400 });

    const result = await toggleStarAsset(userId, assetId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
