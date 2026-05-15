/**
 * SP Paketleri — yeni paket oluşturma endpoint'i.
 * POST /yonet/api/sp-packages  body: { create: {...} }
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

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30) || 'pack';
}

export async function POST(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.create) return NextResponse.json({ error: 'create alanı eksik' }, { status: 400 });

  const safe: Record<string, any> = {};
  for (const k of Object.keys(body.create)) {
    if (ALLOWED_FIELDS.has(k)) safe[k] = body.create[k];
  }
  if (!safe.tier_name?.trim()) return NextResponse.json({ error: 'Paket adı gerekli' }, { status: 400 });
  if (!safe.tier_key) return NextResponse.json({ error: 'Seviye gerekli' }, { status: 400 });

  // ID üretimi — tier_key + slug + timestamp
  safe.id = `sp_${safe.tier_key}_${slugify(safe.tier_name)}_${Date.now().toString(36).slice(-4)}`;

  const { data, error } = await supabaseAdmin
    .from('sp_packages')
    .insert(safe)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, pack: data });
}
