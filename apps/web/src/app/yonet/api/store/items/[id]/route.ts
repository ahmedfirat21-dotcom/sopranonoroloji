import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

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
    const { error } = await supabaseAdmin.from('cosmetic_items').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
    return NextResponse.json({ ok: true, item: data });
  }

  return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
}
