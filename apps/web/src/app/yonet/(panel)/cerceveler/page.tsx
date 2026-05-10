/**
 * SopranoChat Admin — Çerçeveler
 * ★ 2026-05-11: Bu sayfa Mağaza'ya redirect olur. Çerçeve yönetimi artık
 *   tek merkez Mağaza altında (kategori filtresi: frames). Frame-spesifik
 *   konfig için mağaza ürün satırındaki "🎨 Konfig" butonu /cerceveler/[id]'ye
 *   deeplink yapar — sayfa olarak kalsa bile sidebar'dan girilmiyor artık.
 */
import { redirect } from 'next/navigation';

export default function CerceveLerPage() {
  redirect('/yonet/magaza?cat=frames');
}
