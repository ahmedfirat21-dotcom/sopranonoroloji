# Vercel Deploy Planı — Çerçeve & Giriş Efekti Editörü

## Sorun
Web admin'de **2 yer Vercel'de fail eder** çünkü Vercel filesystem **read-only**:

1. `apps/web/src/app/api/yonet/frames/new/route.ts` — `writeFile(public/lotties/${id}.json)` çağrısı
2. `apps/web/src/app/api/yonet/frames/ai-generate/route.ts` — `readFile(public/lotties/...)` (bu OK ama yazma başarısız olunca AI'da boş dönecek)

Local dev'de çalışır (filesystem yazılabilir), Vercel prod'da yazma denemesi `EROFS: read-only file system` hatasıyla 500 döner.

## Çözüm: Supabase Storage'a yükle

### Adım 1 — Supabase Storage bucket oluştur
```sql
-- Supabase SQL Editor'de çalıştır:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cosmetic-lotties', 'cosmetic-lotties', true, 5242880, ARRAY['application/json', 'application/zip'])
ON CONFLICT (id) DO NOTHING;

-- RLS: public read, admin upload
CREATE POLICY "Public read cosmetic-lotties" ON storage.objects FOR SELECT USING (bucket_id = 'cosmetic-lotties');
-- Service role zaten her şeyi yapabilir, ek policy gerekmez
```

### Adım 2 — `apps/web/src/app/api/yonet/frames/new/route.ts` güncelle
**Mevcut:**
```ts
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// ...
const publicLottieDir = path.join(process.cwd(), 'public', 'lotties');
try { await mkdir(publicLottieDir, { recursive: true }); } catch {}
const lottieFileName = `${form.id}.json`;
const lottiePath = path.join(publicLottieDir, lottieFileName);
await writeFile(lottiePath, JSON.stringify(lottieJson));
const lottieUrl = `/lotties/${lottieFileName}`;
```

**Yeni:**
```ts
// fs imports'ları KALDIR

// ... after JSON validation:
const lottieFileName = `${form.id}.json`;
const lottieBuffer = Buffer.from(JSON.stringify(lottieJson), 'utf8');

const { error: uploadErr } = await supabaseAdmin.storage
  .from('cosmetic-lotties')
  .upload(lottieFileName, lottieBuffer, {
    contentType: 'application/json',
    upsert: true,
  });
if (uploadErr) {
  return NextResponse.json({ error: `Storage upload fail: ${uploadErr.message}` }, { status: 500 });
}

const { data: urlData } = supabaseAdmin.storage
  .from('cosmetic-lotties')
  .getPublicUrl(lottieFileName);
const lottieUrl = urlData.publicUrl;  // https://...supabase.co/storage/v1/object/public/cosmetic-lotties/xxx.json
```

### Adım 3 — `apps/web/src/app/api/yonet/frames/ai-generate/route.ts` güncelle
**Mevcut:**
```ts
import { readFile } from 'fs/promises';
import path from 'path';

async function loadTemplate(file: string): Promise<any> {
  const fpath = path.join(process.cwd(), 'public', 'lotties', file);
  const text = await readFile(fpath, 'utf8');
  return JSON.parse(text);
}
```

**Yeni:**
- Template'leri Supabase Storage'da `cosmetic-lotties/templates/` altında tut
- Veya template'leri sabit JSON olarak `apps/web/src/lib/lottie-templates/` altına gömerek import et (en pratik):

```ts
// apps/web/src/lib/lottie-templates/index.ts
import sopranoAura from './SopranoAura.json';
import sunriseGold from './SunriseGold.json';
// ... 11 template

export const TEMPLATE_LIBRARY: Record<string, any> = {
  'SopranoAura.json': sopranoAura,
  'SunriseGold.json': sunriseGold,
  // ...
};
```

Sonra route'ta:
```ts
import { TEMPLATE_LIBRARY } from '@/lib/lottie-templates';

async function loadTemplate(file: string): Promise<any> {
  return TEMPLATE_LIBRARY[file] || null;
}
```

### Adım 4 — Mobile tarafı (`c:/SopranoChat/`)
Mobile zaten `cosmeticConfigCache.ts` üzerinden `editor_config.lottie_url` okuyor.
Web admin'den remote URL geldiğinde mobile bu URL'yi `LottieView source={{ uri: remoteUrl }}` ile yükler — `RemoteAssetFrame.tsx` (AvatarFrame altındaki) zaten bu pattern'ı destekliyor.

**Tek bir kontrol:** `RemoteAssetFrame.tsx` veya `RoomEntryEffectOverlay.tsx`'in remote Lottie URL'i fetch edebildiğinden emin ol. Test:
- Yeni bir çerçeve oluştur (Vercel admin'den)
- Mobile app'i restart et
- Mağazada görünmeli, equip → frame yüklenmeli

### Adım 5 — Mevcut local dosyaları Storage'a taşı (one-time migration)
```bash
# Local public/lotties altındaki tüm Lottie'leri Storage'a yükle
cd apps/web/public/lotties
for f in *.json; do
  curl -X POST "https://kpofiuczyjesjlqjxswh.supabase.co/storage/v1/object/cosmetic-lotties/$f" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    --data-binary @"$f"
done
```

### Adım 6 — Vercel env vars
Vercel dashboard → Project Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL` (zaten var)
- `SUPABASE_SERVICE_ROLE_KEY` (zaten var)
- `ANTHROPIC_API_KEY` (Claude AI için, opsiyonel)
- `ADMIN_PASSWORD_HASH` veya `ADMIN_ACCESS_KEY` (admin auth)
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (admin Google OAuth)

### Adım 7 — Google OAuth redirect URI
Google Cloud Console'da OAuth client'a ekle:
- `https://your-vercel-domain.vercel.app/yonet/api/auth/google/callback`

### Adım 8 — Test
Deploy sonrası:
1. https://your-domain/yonet/cerceveler/yeni → yeni frame ekle
2. Lottie upload → Storage'a yüklenmeli
3. Mağazada görünmeli
4. Mobile app restart → yeni frame görünmeli

## Özet
- **fs.writeFile/readFile → Supabase Storage'a geç** (yeni frame upload + AI template loading)
- **Template'leri kod içine import et** veya Storage'a yükle (read için)
- **Mobile zaten remote URL destekliyor** — sadece web admin'in Storage'a yazması gerek

Toplam iş: **~2 saat** (kod değişiklikleri) + **~30dk** (Supabase setup + test).

## Dokunulmayacaklar
- `apps/web/public/lotties/*.json` dosyaları silinmez — local dev için duruyor
- DB schema (`editor_config` JSONB kolonu) — zaten doğru
- Mobile `services/cosmeticConfigCache.ts` — değişiklik gerektirmez
