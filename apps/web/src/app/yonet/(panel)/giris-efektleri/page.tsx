/**
 * SopranoChat Admin — Giriş Efektleri
 * ★ 2026-05-11: Bu sayfa Mağaza'ya redirect olur. Giriş efekti yönetimi
 *   artık tek merkez Mağaza altında (kategori filtresi: entry_effect).
 *   Editor için mağaza ürün satırındaki "🎨 Konfig" butonu deeplink yapar.
 */
import { redirect } from 'next/navigation';

export default function GirisEfektleriPage() {
  redirect('/yonet/magaza?cat=entry_effect');
}
