// app/api/cron/sync-prices/route.js
// ─────────────────────────────────────────────────────────────
//  Vercel Cron Job endpoint — runs every 60 s in production
//  Secured with CRON_SECRET env variable
// ─────────────────────────────────────────────────────────────
import { syncPrices } from '@/lib/syncPrices';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Protect the route so only Vercel Cron can call it
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncPrices();
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('[cron/sync-prices]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
