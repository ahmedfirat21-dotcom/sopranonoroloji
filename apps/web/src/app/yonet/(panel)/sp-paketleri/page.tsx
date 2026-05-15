/**
 * SopranoChat Admin — SP Paketleri
 * ★ P0-2 (16 May 2026): APK mağazasında "SP Paketleri" sekmesi vardı ama admin UI yoktu.
 *   Yeni paket eklemek için DB SQL gerekiyordu — şimdi buradan yönetilir.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Coins } from 'lucide-react';
import SPPacksClient from './SPPacksClient';

async function loadPacks() {
  const { data } = await supabaseAdmin
    .from('sp_packages')
    .select('*')
    .order('sort_order', { ascending: true });
  return data || [];
}

export default async function SPPaketleriPage() {
  const packs = await loadPacks();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Coins className="w-6 h-6 text-amber-400" /> SP Paketleri
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {packs.length} paket · APK mağazasının "SP Paketleri" sekmesinde gözükür
        </p>
      </div>

      <SPPacksClient initialPacks={packs} />
    </div>
  );
}
