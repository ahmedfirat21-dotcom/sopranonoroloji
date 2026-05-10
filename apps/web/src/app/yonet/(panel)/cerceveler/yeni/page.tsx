/**
 * SopranoChat Admin — Yeni Çerçeve (eski sayfa)
 * ★ 2026-05-11: Mağaza'ya yönlendirilir. Yeni çerçeve eklemek için artık
 *   Mağaza içindeki "Yeni Ürün Ekle → Çerçeve" QuickAddModal kullanılıyor.
 *   NewFrameForm kaldırıldı (358 satır + TS hataları).
 */
import { redirect } from 'next/navigation';

export default function NewFramePage() {
  redirect('/yonet/magaza?cat=frames');
}
