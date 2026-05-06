import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

const BUNDLE_FIELDS = new Set([
  'name', 'tagline', 'art_emoji', 'art_color',
  'bg_gradient_start', 'bg_gradient_end', 'rarity',
  'total_price_sp', 'discount_pct', 'sort_order', 'active',
]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (body?.update) {
    const safe: Record<string, any> = {};
    for (const k of Object.keys(body.update)) {
      if (BUNDLE_FIELDS.has(k)) safe[k] = body.update[k];
    }
    const { error } = await supabaseAdmin
      .from('cosmetic_bundles')
      .update(safe)
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
}
