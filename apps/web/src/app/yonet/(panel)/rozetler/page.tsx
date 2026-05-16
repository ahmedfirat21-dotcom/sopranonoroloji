/**
 * SopranoChat Admin — Rozetler
 * ★ v283 (16 May 2026): Bu sayfa Mağaza'ya redirect olur. Rozet yönetimi tek merkez
 *   Mağaza altında (kategori filtresi: badge). Rozet-spesifik konfig için mağaza ürün
 *   satırındaki "🎨 Konfig" butonu /rozetler/[id]'ye deeplink yapar.
 */
import { redirect } from 'next/navigation';

export default function RozetlerPage() {
  redirect('/yonet/magaza?cat=badge');
}
