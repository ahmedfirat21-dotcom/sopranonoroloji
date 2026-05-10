import { NextRequest, NextResponse } from 'next/server';

// ★ 2026-05-10 SECURITY: Hardcoded API key kaldırıldı, env'den okunuyor.
//   Eski key: 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65' — kullanıcının ROTATE etmesi gerekir.
const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
const GIPHY_BASE = 'https://api.giphy.com/v1/gifs';

export async function GET(req: NextRequest) {
    if (!GIPHY_API_KEY) {
        return NextResponse.json({ data: [], error: 'GIPHY_API_KEY env not set' }, { status: 500 });
    }
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const limit = searchParams.get('limit') || '30';

    try {
        const endpoint = q
            ? `${GIPHY_BASE}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=${limit}&rating=g&lang=tr`
            : `${GIPHY_BASE}/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&rating=g`;

        const res = await fetch(endpoint);
        if (!res.ok) {
            return NextResponse.json({ data: [], error: 'GIPHY API hatası' }, { status: res.status });
        }
        const json = await res.json();
        return NextResponse.json({ data: json.data || [] });
    } catch {
        return NextResponse.json({ data: [], error: 'Sunucu hatası' }, { status: 500 });
    }
}
