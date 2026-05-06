/**
 * Mağaza kategori etiketleri (Türkçe).
 * DB'deki `category` slug → kullanıcı dostu isim + ikon emoji.
 */
export type CategoryDef = {
  slug: string;
  label: string;
  emoji: string;
  description: string;
};

export const CATEGORIES: CategoryDef[] = [
  { slug: 'frames', label: 'Çerçeveler', emoji: '🖼', description: 'Profil avatarı çerçeveleri' },
  { slug: 'entry_effect', label: 'Giriş Animasyonları', emoji: '✨', description: 'Odaya girişte oynayan animasyonlar' },
  { slug: 'gift', label: 'Hediyeler', emoji: '🎁', description: 'Sohbete gönderilen hediyeler' },
  { slug: 'glow_message', label: 'Parlak Mesajlar', emoji: '💬', description: 'Sohbet baloncuk parıltısı' },
  { slug: 'effect', label: 'Efektler', emoji: '🌟', description: 'Genel görsel efektler' },
  { slug: 'theme', label: 'Temalar', emoji: '🎨', description: 'Profil/oda temaları' },
  { slug: 'background', label: 'Arkaplanlar', emoji: '🌌', description: 'Profil arkaplanları' },
  { slug: 'emoji', label: 'Özel Emojiler', emoji: '😎', description: 'Premium emojiler' },
  { slug: 'badge', label: 'Rozetler', emoji: '🏅', description: 'Profil rozetleri' },
];

export function getCategoryDef(slug: string | null | undefined): CategoryDef {
  return CATEGORIES.find(c => c.slug === slug) ?? {
    slug: slug || 'other',
    label: slug || 'Diğer',
    emoji: '📦',
    description: '',
  };
}
