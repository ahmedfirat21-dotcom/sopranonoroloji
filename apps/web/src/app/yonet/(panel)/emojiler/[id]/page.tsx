import { supabaseAdmin } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import EmojiEditor from './EmojiEditor';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: item } = await supabaseAdmin
    .from('cosmetic_items').select('*').eq('id', id).eq('category', 'emoji').single();
  if (!item) return notFound();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/yonet/magaza?cat=emoji" className="text-slate-400 hover:text-slate-100 inline-flex items-center text-sm">
          <ChevronLeft className="w-4 h-4 mr-1" /> Geri
        </Link>
        <span className="text-slate-600">/</span>
        <h1 className="text-xl font-semibold">{item.name}</h1>
        <code className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">{item.id}</code>
      </div>
      <EmojiEditor item={item} />
    </div>
  );
}
