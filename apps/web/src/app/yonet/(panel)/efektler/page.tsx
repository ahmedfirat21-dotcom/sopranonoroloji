/**
 * SopranoChat Admin — Efektler
 * ★ v283 (16 May 2026): Bu sayfa Mağaza'ya redirect olur. Efekt yönetimi tek merkez
 *   Mağaza altında (kategori filtresi: effect). Editor için /efektler/[id] deeplink kalır.
 */
import { redirect } from 'next/navigation';

export default function EfektlerPage() {
  redirect('/yonet/magaza?cat=effect');
}
