/**
 * SP Paketleri — tek paket güncelle/sil endpoint'i.
 * POST /yonet/api/sp-packages/[id]  body: { update: {...} } veya { delete: true }
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

const ALLOWED_FIELDS = new Set([
  'tier_name', 'tier_key', 'tier_color',
  'sp_amount', 'bonus_sp', 'bonus_pct',
  'price_try', 'fiat_label',
  'popular', 'sort_order', 'is_active',
]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'ID eksik' }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Geçersiz body' }, { status: 400 });

  if (body.delete) {
    const { error } = await supabaseAdmin.from('sp_packages').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, deleted: id });
  }

  if (body.update) {
    const safe: Record<string, any> = {};
    for (const k of Object.keys(body.update)) {
      if (ALLOWED_FIELDS.has(k)) safe[k] = body.update[k];
    }
    if (Object.keys(safe).length === 0) {
      return NextResponse.json({ error: 'Güncellenebilir alan yok' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from('sp_packages')
      .update(safe)
      .eq('id', id)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, pack: data });
  }

  return NextResponse.json({ error: 'Bilinmeyen aksiyon' }, { status: 400 });
}
