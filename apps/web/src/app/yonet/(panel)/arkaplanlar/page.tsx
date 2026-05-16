/**
 * SopranoChat Admin — Arkaplanlar
 * ★ v283 (16 May 2026): Bu sayfa Mağaza'ya redirect olur. Arkaplan yönetimi tek merkez
 *   Mağaza altında (kategori filtresi: background). Editor için /arkaplanlar/[id] deeplink kalır.
 */
import { redirect } from 'next/navigation';

export default function ArkaplanlarPage() {
  redirect('/yonet/magaza?cat=background');
}
