/**
 * ★ P0-3 (16 May 2026): Cosmetic Bundle oluşturma endpoint'i.
 * POST /yonet/api/store/bundles  body: { create: {...} }
 */
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

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30) || 'bundle';
}

export async function POST(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.create) return NextResponse.json({ error: 'create alanı eksik' }, { status: 400 });

  const safe: Record<string, any> = {};
  for (const k of Object.keys(body.create)) {
    if (BUNDLE_FIELDS.has(k)) safe[k] = body.create[k];
  }
  if (!safe.name?.trim()) return NextResponse.json({ error: 'Paket adı gerekli' }, { status: 400 });

  // ID üretimi — slug + timestamp
  safe.id = `bundle_${slugify(safe.name)}_${Date.now().toString(36).slice(-4)}`;

  const { data, error } = await supabaseAdmin
    .from('cosmetic_bundles')
    .insert(safe)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // İçerik (ürünler) verilmişse ekle
  if (Array.isArray(body.item_ids) && body.item_ids.length > 0) {
    const rows = body.item_ids
      .filter((s: any) => typeof s === 'string')
      .map((item_id: string) => ({ bundle_id: data.id, item_id }));
    if (rows.length > 0) {
      await supabaseAdmin.from('cosmetic_bundle_items').insert(rows);
    }
  }

  return NextResponse.json({ ok: true, bundle: data });
}
