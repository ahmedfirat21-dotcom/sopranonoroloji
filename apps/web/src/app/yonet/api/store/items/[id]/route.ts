import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/admin/audit';

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

const ITEM_FIELDS = new Set([
  'category', 'rarity', 'name', 'meta', 'tagline', 'art_emoji', 'art_color',
  'bg_gradient_start', 'bg_gradient_mid', 'bg_gradient_end', 'bg_radial',
  'price_sp', 'per_message', 'is_featured', 'collection_id', 'active', 'display_order',
]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (body?.delete) {
    // ★ v110.14: FK ihlali önle — ürün silmeden önce ilişkili tabloları temizle.
    //   cosmetic_bundle_items: ürün bir paket içindeyse paket girişi de silinir.
    //   user_inventory: kullanıcılarda varsa onlardan da kaldır (sahip olduğu ürün gider).
    //   daily_deals: bugün/yarın deal varsa o da silinmeli.
    try {
      await supabaseAdmin.from('cosmetic_bundle_items').delete().eq('item_id', id);
    } catch { /* tablo yok ya da boş — sessiz */ }
    try {
      await supabaseAdmin.from('user_inventory').delete().eq('item_id', id);
    } catch { /* sessiz */ }
    try {
      await supabaseAdmin.from('daily_deals').delete().eq('item_id', id);
    } catch { /* sessiz */ }
    const { error } = await supabaseAdmin.from('cosmetic_items').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logAudit({ action: 'store_item_delete', target_type: 'item', target_id: id });
    return NextResponse.json({ ok: true });
  }

  if (body?.update) {
    const safe: Record<string, any> = {};
    for (const k of Object.keys(body.update)) {
      if (ITEM_FIELDS.has(k)) safe[k] = body.update[k];
    }
    if (Object.keys(safe).length === 0) {
      return NextResponse.json({ error: 'Güncellenebilir alan yok' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from('cosmetic_items')
      .update(safe)
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logAudit({
      action: 'store_item_update',
      target_type: 'item',
      target_id: id,
      payload: { fields: Object.keys(safe) },
    });
    return NextResponse.json({ ok: true, item: data });
  }

  return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
}
