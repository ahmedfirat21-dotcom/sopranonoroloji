/**
 * POST /api/yonet/frames/new
 * Yeni çerçeve oluşturur: Lottie JSON'u Supabase Storage'a yükler +
 * cosmetic_items tablosuna INSERT.
 *
 * v2 — fs.writeFile yerine Supabase Storage (Vercel read-only FS uyumlu)
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const form = body?.form;
  const lottieJson = body?.lottieJson;

  if (!form?.id || !form?.name) {
    return NextResponse.json({ error: 'isim ve id zorunlu' }, { status: 400 });
  }
  if (!/^[a-z0-9-]+$/.test(form.id)) {
    return NextResponse.json({ error: "ID sadece küçük harf, rakam ve '-' içerebilir" }, { status: 400 });
  }
  if (!lottieJson || !lottieJson.layers) {
    return NextResponse.json({ error: 'Geçerli Lottie JSON gerekli' }, { status: 400 });
  }

  // 1) Lottie'yi Supabase Storage'a yükle
  const lottieFileName = `${form.id}.json`;
  const lottieBuffer = Buffer.from(JSON.stringify(lottieJson), 'utf8');

  const { error: uploadErr } = await supabaseAdmin.storage
    .from('cosmetic-lotties')
    .upload(lottieFileName, lottieBuffer, {
      contentType: 'application/json',
      upsert: true,
    });
  if (uploadErr) {
    return NextResponse.json(
      { error: `Storage upload fail: ${uploadErr.message}` },
      { status: 500 },
    );
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('cosmetic-lotties')
    .getPublicUrl(lottieFileName);
  const lottieUrl = urlData.publicUrl;

  // 2) cosmetic_items'a INSERT
  const { data: existing } = await supabaseAdmin
    .from('cosmetic_items')
    .select('id')
    .eq('id', form.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: `'${form.id}' ID'siyle çerçeve zaten var` }, { status: 409 });
  }

  const insertRow = {
    id: form.id,
    name: form.name,
    category: 'frames',
    price_sp: form.price_sp ?? 0,
    min_tier: form.min_tier || null,
    rarity: form.rarity || 'rare',
    art_color: form.art_color || '#fbbf24',
    bg_gradient_start: '#0F0A1A',
    bg_gradient_end: '#1A0A0A',
    tagline: form.tagline || null,
    is_featured: true,
    per_message: false,
    active: true,
    display_order: 100,
    launched_at: new Date().toISOString(),
    meta: 'Çerçeve · Animasyonlu',  // TEXT field — kart altyazısı
    editor_config: {
      lottie_url: lottieUrl,
      frame_config: {
        frame_scale: form.scale ?? 1.0,
        avatar_ratio: form.avatar_ratio ?? 0.92,
      },
    },
  };

  const { error: insertErr } = await supabaseAdmin.from('cosmetic_items').insert(insertRow as any);
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: form.id, lottieUrl });
}
