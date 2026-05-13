import { redirect } from 'next/navigation';

// ★ v120: Tek tek tema ürün editörü kaldırıldı; sistem teması /yonet/tema-sistemi'nde yönetilir.
export default function Page() {
  redirect('/yonet/tema-sistemi');
}
