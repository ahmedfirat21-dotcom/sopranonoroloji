import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

const ITEM_FIELDS = [
  'id', 'category', 'rarity', 'name', 'meta', 'tagline',
  'art_emoji', 'art_color',
  'bg_gradient_start', 'bg_gradient_mid', 'bg_gradient_end', 'bg_radial',
  'price_sp', 'per_message', 'is_featured', 'collection_id', 'active', 'display_order',
];

const ALLOWED_CATEGORIES = new Set([
  'frames', 'entry_effect', 'gift', 'glow_message',
  'effect', 'theme', 'background', 'emoji', 'badge',
]);

const VALID_RARITIES = new Set(['common', 'rare', 'epic', 'legendary', 'mythic']);

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

function autoGenerateId(category: string, name: string): string {
  const slug = slugifyName(name);
  const stamp = Date.now().toString(36).slice(-4);
  const rand = Math.random().toString(36).slice(2, 5);
  return `${category}_${slug || 'item'}_${stamp}${rand}`;
}

export async function POST(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  // İki format kabul: { items: [...] } veya doğrudan dizi [...]
  const itemsRaw: any[] = Array.isArray(body) ? body : Array.isArray(body?.items) ? body.items : [];

  if (itemsRaw.length === 0) {
    return NextResponse.json({ error: 'Ürün listesi boş veya geçersiz format' }, { status: 400 });
  }
  if (itemsRaw.length > 200) {
    return NextResponse.json({ error: 'Tek seferde max 200 ürün yüklenebilir' }, { status: 400 });
  }

  // Her satırı sanitize et + validate et
  const sanitized: Record<string, any>[] = [];
  const errors: { index: number; error: string; raw: any }[] = [];

  itemsRaw.forEach((raw, i) => {
    if (!raw || typeof raw !== 'object') {
      errors.push({ index: i, error: 'Nesne bekleniyor', raw });
      return;
    }
    const cat = String(raw.category || '').trim();
    const name = String(raw.name || '').trim();
    if (!cat || !ALLOWED_CATEGORIES.has(cat)) {
      errors.push({ index: i, error: `Geçersiz kategori: "${cat}"`, raw });
      return;
    }
    if (!name) {
      errors.push({ index: i, error: 'İsim boş olamaz', raw });
      return;
    }

    const item: Record<string, any> = {};
    for (const k of ITEM_FIELDS) {
      if (k in raw) item[k] = raw[k];
    }

    // Otomatik tamamlamalar
    if (!item.id || typeof item.id !== 'string' || item.id.length < 3) {
      item.id = autoGenerateId(cat, name);
    }
    item.category = cat;
    item.name = name;
    if (!item.rarity || !VALID_RARITIES.has(item.rarity)) item.rarity = 'common';
    if (typeof item.price_sp !== 'number' || isNaN(item.price_sp)) item.price_sp = 100;
    if (item.price_sp < 0) item.price_sp = 0;
    if (typeof item.active !== 'boolean') item.active = true;
    if (typeof item.is_featured !== 'boolean') item.is_featured = false;
    if (typeof item.per_message !== 'boolean') item.per_message = cat === 'glow_message';
    if (typeof item.display_order !== 'number') item.display_order = 0;
    if (!item.art_emoji) item.art_emoji = '✨';

    sanitized.push(item);
  });

  if (sanitized.length === 0) {
    return NextResponse.json({
      ok: false,
      error: 'Hiçbir ürün geçerli değil',
      errors,
    }, { status: 400 });
  }

  // Toplu insert — batch'lere bölerek (Supabase 100 max güvenli)
  const BATCH = 50;
  let inserted = 0;
  const dbErrors: { batch: number; error: string }[] = [];

  for (let i = 0; i < sanitized.length; i += BATCH) {
    const slice = sanitized.slice(i, i + BATCH);
    const { data, error } = await supabaseAdmin
      .from('cosmetic_items')
      .insert(slice)
      .select('id');
    if (error) {
      dbErrors.push({ batch: Math.floor(i / BATCH), error: error.message });
    } else {
      inserted += data?.length || 0;
    }
  }

  return NextResponse.json({
    ok: dbErrors.length === 0,
    inserted,
    skipped: errors.length,
    total_input: itemsRaw.length,
    errors,
    db_errors: dbErrors,
  });
}

// GET — mevcut ürünleri JSON olarak döndür (export için)
export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const { data, error } = await supabaseAdmin
    .from('cosmetic_items')
    .select('*')
    .order('category')
    .order('display_order')
    .order('created_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [], count: data?.length || 0 });
}
