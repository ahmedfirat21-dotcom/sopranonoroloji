/**
 * Mağaza kategori tanımları (TR) — Web Admin tarafı
 * ════════════════════════════════════════════════════════════
 * ★ P1-4 (16 May 2026): Bu dosya APK'daki `constants/cosmeticCategories.ts`'in
 *   AYNADIR. Yeni kategori eklenince İKİ YERDE de güncelle. Aksi halde admin'de
 *   kategori gözükür ama APK'da yok (veya tersi) → "kayıp ürün" derdi yaşanır.
 *
 * APK karşılığı: c:\SopranoChat\constants\cosmeticCategories.ts → DB_CATEGORIES
 */
export type CategoryDef = {
  slug: string;
  label: string;
  emoji: string;
  description: string;
};

export const CATEGORIES: CategoryDef[] = [
  { slug: 'frames',        label: 'Çerçeveler',         emoji: '🖼',  description: 'Profil avatarı çerçeveleri' },
  { slug: 'entry_effect',  label: 'Giriş Animasyonları', emoji: '✨', description: 'Odaya girişte oynayan animasyonlar' },
  { slug: 'gift',          label: 'Hediyeler',          emoji: '🎁', description: 'Sohbete gönderilen hediyeler (oda içi pay-per-send)' },
  { slug: 'glow_message',  label: 'Parlak Mesajlar',    emoji: '💬', description: 'Sohbet baloncuk parıltısı' },
  { slug: 'effect',        label: 'Efektler',           emoji: '🌟', description: 'Genel görsel efektler' },
  { slug: 'background',    label: 'Arkaplanlar',        emoji: '🌌', description: 'Profil arkaplanları' },
  { slug: 'emoji',         label: 'Özel Emojiler',      emoji: '😎', description: 'Premium emojiler' },
  { slug: 'badge',         label: 'Rozetler',           emoji: '🏅', description: 'Profil rozetleri' },
  // ★ 'theme' kaldırıldı — uygulama teması sistem ayarıdır, ürün değildir.
  //   Yönetimi: /yonet/tema-sistemi
  // ★ APK'da extra olarak 'bundles' (cosmetic_bundles tablo) ve 'sp' (sp_packages tablo)
  //   sanal tab'lar vardır. Bunlar DB enum'a yazılmaz; ayrı yönetilir.
];

export function getCategoryDef(slug: string | null | undefined): CategoryDef {
  return CATEGORIES.find(c => c.slug === slug) ?? {
    slug: slug || 'other',
    label: slug || 'Diğer',
    emoji: '📦',
    description: '',
  };
}
