import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

const ITEM_FIELDS = [
  'id', 'category', 'rarity', 'name', 'meta', 'tagline', 'art_emoji', 'art_color',
  'bg_gradient_start', 'bg_gradient_mid', 'bg_gradient_end', 'bg_radial',
  'price_sp', 'per_message', 'is_featured', 'collection_id', 'active', 'display_order',
  'asset_url', // ★ 2026-05-10 v114: Lottie/PNG URL — mobile direkt buradan render
];

export async function POST(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const create = body?.create;
  if (!create || !create.id || !create.name) {
    return NextResponse.json({ error: 'ID ve isim gerekli' }, { status: 400 });
  }

  const safe: Record<string, any> = {};
  for (const k of ITEM_FIELDS) {
    if (k in create) safe[k] = create[k];
  }

  const { data, error } = await supabaseAdmin
    .from('cosmetic_items')
    .insert(safe)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, item: data });
}
