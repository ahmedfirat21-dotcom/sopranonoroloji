/**
 * SopranoChat Admin — Parlak Mesajlar
 * ★ v283 (16 May 2026): Bu sayfa Mağaza'ya redirect olur. Parlak mesaj yönetimi tek merkez
 *   Mağaza altında (kategori filtresi: glow_message). Editor için /parlak-mesajlar/[id] deeplink kalır.
 */
import { redirect } from 'next/navigation';

export default function ParlakMesajlarPage() {
  redirect('/yonet/magaza?cat=glow_message');
}
