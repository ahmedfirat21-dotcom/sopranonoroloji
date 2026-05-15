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

  // ★ P0-3: Bundle silme
  if (body?.delete) {
    // Önce bundle_items'ı temizle (FK constraint için)
    await supabaseAdmin.from('cosmetic_bundle_items').delete().eq('bundle_id', id);
    const { error } = await supabaseAdmin.from('cosmetic_bundles').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, deleted: id });
  }

  // ★ P0-3: Bundle update (mevcut)
  if (body?.update) {
    const safe: Record<string, any> = {};
    for (const k of Object.keys(body.update)) {
      if (BUNDLE_FIELDS.has(k)) safe[k] = body.update[k];
    }
    const { data, error } = await supabaseAdmin
      .from('cosmetic_bundles')
      .update(safe)
      .eq('id', id)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, bundle: data });
  }

  // ★ P0-3: Bundle içeriği (ürün listesi) güncelle — komple replace
  if (Array.isArray(body?.set_items)) {
    const itemIds: string[] = body.set_items.filter((s: any) => typeof s === 'string');
    await supabaseAdmin.from('cosmetic_bundle_items').delete().eq('bundle_id', id);
    if (itemIds.length > 0) {
      const rows = itemIds.map(item_id => ({ bundle_id: id, item_id }));
      const { error } = await supabaseAdmin.from('cosmetic_bundle_items').insert(rows);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, item_count: itemIds.length });
  }

  return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
}

// ★ P0-3: GET — bundle içindeki item ID listesi
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('cosmetic_bundle_items')
    .select('item_id')
    .eq('bundle_id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item_ids: (data || []).map((r: any) => r.item_id) });
}
