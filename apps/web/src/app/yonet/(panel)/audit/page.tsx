/**
 * Audit Log — admin işlemlerinin geçmişi.
 * Kim, ne zaman, hangi kullanıcıya ne yaptı.
 * ★ P2-7 (16 May 2026): Filtre UI AuditClient'a taşındı (action tipi/admin/tarih).
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import AuditClient from './AuditClient';

const ACTION_LABEL: Record<string, { label: string; color: string }> = {
  // Kullanıcı
  user_delete: { label: 'Kullanıcı silindi', color: '#F87171' },
  user_update: { label: 'Kullanıcı güncellendi', color: '#5EEAD4' },
  user_toggle_admin: { label: 'Admin yetkisi değişti', color: '#C084FC' },
  user_warn: { label: 'Kullanıcı uyarıldı', color: '#FBBF24' },
  // Para
  cashout_status_change: { label: 'Para çekme durum değişti', color: '#34D399' },
  sp_grant: { label: 'SP grant', color: '#FBBF24' },
  // Oda
  room_delete: { label: 'Oda silindi', color: '#F87171' },
  room_close: { label: 'Oda kapatıldı', color: '#FBBF24' },
  room_wake: { label: 'Oda uyandırıldı', color: '#5EEAD4' },
  room_tier_change: { label: 'Oda tier değişti', color: '#C084FC' },
  // Mesaj
  message_soft_delete: { label: 'Mesaj silindi', color: '#F87171' },
  // Mağaza
  store_item_delete: { label: 'Ürün silindi', color: '#F87171' },
  store_item_update: { label: 'Ürün güncellendi', color: '#5EEAD4' },
  daily_deal_set: { label: 'Daily deal güncellendi', color: '#F472B6' },
  daily_deal_delete: { label: 'Daily deal silindi', color: '#F87171' },
  // Push
  push_send: { label: 'Push gönderildi', color: '#C084FC' },
  // Şikayet
  report_dismiss: { label: 'Şikayet reddedildi', color: '#94A3B8' },
  report_resolve: { label: 'Şikayet çözüldü', color: '#34D399' },
  report_ban: { label: 'Şikayet → ban', color: '#F87171' },
  // Auth
  login_success: { label: 'Admin giriş', color: '#5EEAD4' },
  login_failed: { label: 'Yanlış giriş', color: '#FBBF24' },
  login_locked: { label: 'IP kilitlendi', color: '#F87171' },
  logout: { label: 'Çıkış', color: '#94A3B8' },
  ip_lock_clear: { label: 'IP kilidi açıldı', color: '#5EEAD4' },
};

const PAYLOAD_KEY_LABEL: Record<string, string> = {
  ip: 'IP',
  fails: 'Başarısız deneme',
  locked: 'Kilitli',
  remaining_minutes: 'Kalan dk',
  reason: 'Sebep',
  amount: 'Miktar',
  delta: 'Değişim',
  message: 'Mesaj',
  reported_user_id: 'Raporlanan kullanıcı',
  status: 'Durum',
  make_admin: 'Admin yapıldı',
  is_banned: 'Banlı',
  is_verified: 'Doğrulanmış',
  is_admin: 'Admin',
  system_points: 'SP',
  subscription_tier: 'Üyelik',
  display_name: 'İsim',
  title: 'Başlık',
  body: 'İçerik',
  audience: 'Hedef kitle',
  tier: 'Üyelik',
  user_id: 'Kullanıcı',
  sent: 'Gönderilen',
  failed: 'Hatalı',
  item_id: 'Ürün',
  discount: 'İndirim',
  banner_text: 'Banner',
  active: 'Aktif',
  price_sp: 'Fiyat (SP)',
  category: 'Kategori',
  rarity: 'Nadirlik',
  request_id: 'Talep',
  new_status: 'Yeni durum',
  old_status: 'Eski durum',
  admin_note: 'Admin notu',
  link: 'Bağlantı',
};

async function loadLogs() {
  const { data } = await supabaseAdmin
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);
  return data || [];
}

export default async function AuditPage() {
  const logs = await loadLogs();
  return (
    <AuditClient
      logs={logs as any}
      actionMeta={ACTION_LABEL}
      payloadKeyLabel={PAYLOAD_KEY_LABEL}
    />
  );
}
