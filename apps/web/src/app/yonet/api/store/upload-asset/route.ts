import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

const BUCKET = 'cosmetic-assets';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES: Record<string, string> = {
  'application/json': 'json',         // Lottie / dotlottie
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

export async function POST(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'FormData okunamadı' }, { status: 400 });
  }

  const file = formData.get('file');
  const category = String(formData.get('category') || 'general');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `Dosya max ${MAX_BYTES / 1024 / 1024} MB olabilir` }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({
      error: `Geçersiz dosya tipi (${file.type}). İzinli: JSON (Lottie), PNG, JPG, SVG, GIF, WebP`,
    }, { status: 400 });
  }

  // Dosya adı: kategori_zaman-rastgele.uzantı
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const safeCat = category.replace(/[^a-z0-9_]/gi, '');
  const filename = `${safeCat}/${timestamp}-${random}.${ext}`;

  // Dosyayı yükle
  const buffer = await file.arrayBuffer();
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: file.type,
      cacheControl: '31536000', // 1 yıl
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: 'Yükleme hatası: ' + uploadError.message }, { status: 500 });
  }

  // Public URL al
  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename);
  const publicUrl = urlData.publicUrl;

  return NextResponse.json({
    ok: true,
    url: publicUrl,
    path: filename,
    type: ext,
    size: file.size,
    asset_type: ext === 'json' ? 'lottie' : 'image',
  });
}

// GET — bucket'taki tüm asset'leri listele (yedekleme/tarama)
export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).list('', {
    limit: 1000,
    sortBy: { column: 'created_at', order: 'desc' },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ files: data || [] });
}
