/**
 * SopranoChat Admin — Emojiler
 * ★ v283 (16 May 2026): Bu sayfa Mağaza'ya redirect olur. Emoji set yönetimi tek merkez
 *   Mağaza altında (kategori filtresi: emoji). Editor için /emojiler/[id] deeplink kalır.
 */
import { redirect } from 'next/navigation';

export default function EmojilerPage() {
  redirect('/yonet/magaza?cat=emoji');
}
