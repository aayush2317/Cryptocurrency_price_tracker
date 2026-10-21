// app/api/watchlist/[id]/route.js
// ─────────────────────────────────────────────────────────────
//  GET /api/watchlist/:id  –  returns watchlist assets + prices
// ─────────────────────────────────────────────────────────────
import { getUserWatchlist } from '@/lib/db';
import { NextResponse }     from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  try {
    const assets = await getUserWatchlist(params.id);
    return NextResponse.json({ data: assets });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
