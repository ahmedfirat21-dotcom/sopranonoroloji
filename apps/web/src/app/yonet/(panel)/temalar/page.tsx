import { redirect } from 'next/navigation';

// ★ v120: Tema artık mağaza ürünü değil — sistem ayarı.
//   /yonet/temalar → /yonet/tema-sistemi'ne yönlendirir.
export default function Page() {
  redirect('/yonet/tema-sistemi');
}
