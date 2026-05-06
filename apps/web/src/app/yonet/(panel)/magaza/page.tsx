/**
 * SopranoChat Admin — Mağaza
 * Kozmetik ürün ve paket yönetimi.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Store } from 'lucide-react';
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Store className="w-6 h-6 text-amber-400" /> Mağaza
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {items.length} ürün · {bundles.length} paket
        </p>
      </div>

      <StoreClient initialItems={items} initialBundles={bundles} />
    </div>
  );
}
