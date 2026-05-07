/**
 * Daily Deal API — bugünün/seçili tarihin günlük fırsatını getirir, ekler, siler.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/admin/audit';

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

// Listele — son 30 günlük geçmiş + bugün/gelecek
export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const { data, error } = await supabaseAdmin
    .from('daily_deals')
    .select('deal_date, item_id, extra_discount_pct, banner_text, created_at, cosmetic_items(name, art_emoji, art_color, price_sp)')
    .order('deal_date', { ascending: false })
    .limit(60);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deals: data });
}

// Ekle / güncelle (upsert by deal_date)
export async function POST(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const dealDate: string | undefined = body.deal_date;
  const itemId: string | undefined = body.item_id;
  const discount = Number(body.extra_discount_pct);
  const bannerText: string = body.banner_text || '';

  if (!dealDate || !itemId) {
    return NextResponse.json({ error: 'deal_date ve item_id gerekli' }, { status: 400 });
  }
  if (!Number.isFinite(discount) || discount < 0 || discount > 80) {
    return NextResponse.json({ error: 'extra_discount_pct 0-80 arası olmalı' }, { status: 400 });
  }

  // Item var mı kontrol
  const { data: item, error: itemErr } = await supabaseAdmin
    .from('cosmetic_items')
    .select('id, name')
    .eq('id', itemId)
    .maybeSingle();
  if (itemErr || !item) {
    return NextResponse.json({ error: `Ürün bulunamadı: ${itemId}` }, { status: 404 });
  }

  const { error } = await supabaseAdmin
    .from('daily_deals')
    .upsert(
      { deal_date: dealDate, item_id: itemId, extra_discount_pct: discount, banner_text: bannerText },
      { onConflict: 'deal_date' }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  logAudit({
    action: 'daily_deal_set',
    target_type: 'daily_deal',
    target_id: dealDate,
    payload: { item_id: itemId, discount, banner_text: bannerText.slice(0, 80) },
  });
  return NextResponse.json({ ok: true });
}

// Sil — query: ?date=YYYY-MM-DD
export async function DELETE(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const dealDate = searchParams.get('date');
  if (!dealDate) {
    return NextResponse.json({ error: 'date query gerekli' }, { status: 400 });
  }
  const { error } = await supabaseAdmin
    .from('daily_deals')
    .delete()
    .eq('deal_date', dealDate);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  logAudit({ action: 'daily_deal_delete', target_type: 'daily_deal', target_id: dealDate });
  return NextResponse.json({ ok: true });
}
