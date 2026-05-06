import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

// GET — kullanıcının envanteri (ürün detaylarıyla)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const { id } = await params;

  const { data: inv, error } = await supabaseAdmin
    .from('user_inventory')
    .select('item_id, acquired_at, acquired_via')
    .eq('user_id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!inv || inv.length === 0) return NextResponse.json({ inventory: [] });

  // Item detaylarını çek
  const itemIds = inv.map(i => i.item_id);
  const { data: items } = await supabaseAdmin
    .from('cosmetic_items')
    .select('*')
    .in('id', itemIds);
  const itemMap = Object.fromEntries((items || []).map(i => [i.id, i]));

  const enriched = inv.map(i => ({
    ...i,
    item: itemMap[i.item_id] || null,
  }));

  return NextResponse.json({ inventory: enriched });
}

// POST — envantere ürün ekle
//   { add: 'item_id' }
//   { add_all: true }                         → tüm aktif ürünleri ekle
//   { remove: 'item_id' }
//   { clear: true }                           → tüm envanteri temizle
//   { test_account: true }                    → Pro tier + 999999 SP + tüm aktif ürünler
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // Test hesabı modu: Pro + 999999 SP + tüm aktif ürünler
  if (body.test_account) {
    const { data: items } = await supabaseAdmin
      .from('cosmetic_items')
      .select('id')
      .eq('active', true);
    const allIds = (items || []).map(i => i.id);

    const inserts = allIds.map(itemId => ({
      user_id: id,
      item_id: itemId,
      acquired_via: 'admin_test',
    }));

    if (inserts.length > 0) {
      await supabaseAdmin.from('user_inventory').upsert(inserts, { onConflict: 'user_id,item_id' });
    }

    await supabaseAdmin
      .from('profiles')
      .update({
        subscription_tier: 'Pro',
        system_points: 999999,
      })
      .eq('id', id);

    return NextResponse.json({ ok: true, added: inserts.length });
  }

  // Tüm aktif ürünleri ekle
  if (body.add_all) {
    const { data: items } = await supabaseAdmin
      .from('cosmetic_items')
      .select('id')
      .eq('active', true);
    const allIds = (items || []).map(i => i.id);

    const inserts = allIds.map(itemId => ({
      user_id: id,
      item_id: itemId,
      acquired_via: 'admin_grant',
    }));

    if (inserts.length === 0) return NextResponse.json({ ok: true, added: 0 });

    const { error } = await supabaseAdmin
      .from('user_inventory')
      .upsert(inserts, { onConflict: 'user_id,item_id' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, added: inserts.length });
  }

  // Envanteri tamamen temizle
  if (body.clear) {
    const { error } = await supabaseAdmin.from('user_inventory').delete().eq('user_id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Tek ürün ekle
  if (body.add) {
    const { error } = await supabaseAdmin.from('user_inventory').upsert({
      user_id: id,
      item_id: String(body.add),
      acquired_via: 'admin_grant',
    }, { onConflict: 'user_id,item_id' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Tek ürün kaldır
  if (body.remove) {
    const { error } = await supabaseAdmin
      .from('user_inventory')
      .delete()
      .eq('user_id', id)
      .eq('item_id', String(body.remove));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Geçersiz aksiyon' }, { status: 400 });
}
