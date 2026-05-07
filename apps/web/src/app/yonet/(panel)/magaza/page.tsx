/**
 * SopranoChat Admin — Mağaza
 * Kozmetik ürün ve paket yönetimi.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Store, Zap } from 'lucide-react';
import Link from 'next/link';
import StoreClient from './StoreClient';

async function loadItems() {
  const { data } = await supabaseAdmin
    .from('cosmetic_items')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  return data || [];
}

async function loadBundles() {
  const { data } = await supabaseAdmin
    .from('cosmetic_bundles')
    .select('*')
    .order('sort_order', { ascending: true });
  return data || [];
}

export default async function MagazaPage() {
  const [items, bundles] = await Promise.all([loadItems(), loadBundles()]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Store className="w-6 h-6 text-amber-400" /> Mağaza
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {items.length} ürün · {bundles.length} paket
          </p>
        </div>
        <Link
          href="/yonet/magaza/daily-deal"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500/20 to-fuchsia-500/15 border border-pink-500/40 text-pink-200 text-sm font-bold hover:from-pink-500/30 hover:to-fuchsia-500/25 transition-colors"
        >
          <Zap className="w-4 h-4" /> Günün Fırsatı
        </Link>
      </div>

      <StoreClient initialItems={items} initialBundles={bundles} />
    </div>
  );
}
