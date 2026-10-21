// app/api/search/route.js
// ─────────────────────────────────────────────────────────────
//  GET /api/search?q=bitcoin
//  Powers the "Search any asset…" command bar
// ─────────────────────────────────────────────────────────────
import { searchAssets } from '@/lib/db';
import { NextResponse }  from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const q = new URL(request.url).searchParams.get('q') ?? '';
  if (q.trim().length < 1)
    return NextResponse.json({ data: [] });

  try {
    const results = await searchAssets(q.trim(), 10);
    return NextResponse.json({ data: results });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
