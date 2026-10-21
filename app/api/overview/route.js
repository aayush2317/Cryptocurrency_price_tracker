// app/api/overview/route.js
// ─────────────────────────────────────────────────────────────
//  GET /api/overview
//  Returns dashboard market overview + market movers
// ─────────────────────────────────────────────────────────────
import { getMarketOverview, getMarketMovers } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [overview, trending, gainers, losers] = await Promise.all([
      getMarketOverview(),
      getMarketMovers('trending',   5),
      getMarketMovers('top_gainer', 5),
      getMarketMovers('top_loser',  5),
    ]);

    return NextResponse.json({
      overview,
      movers: { trending, gainers, losers },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
