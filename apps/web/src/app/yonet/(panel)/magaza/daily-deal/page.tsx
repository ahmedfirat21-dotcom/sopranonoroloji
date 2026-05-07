/**
 * Daily Deal yönetim sayfası — günlük öne çıkan ürünü ayarla.
 * Mağazada hero altında pembe gradient banner olarak gösterilir.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Zap, ArrowLeft } from 'lucide-react';
import DailyDealClient from './DailyDealClient';

async function loadInitial() {
  const { data: deals } = await supabaseAdmin
    .from('daily_deals')
    .select('deal_date, item_id, extra_discount_pct, banner_text, created_at')
    .order('deal_date', { ascending: false })
    .limit(60);

  const { data: items } = await supabaseAdmin
    .from('cosmetic_items')
    .select('id, name, category, rarity, price_sp, art_emoji, art_color, active')
    .eq('active', true)
    .order('category')
    .order('name');

  return { deals: deals || [], items: items || [] };
}

export default async function DailyDealPage() {
  const { deals, items } = await loadInitial();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link
            href="/yonet/magaza"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-300 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Mağaza
          </Link>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-pink-400" /> Günün Fırsatı (Daily Deal)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Mağazanın üstünde pembe gradient kart olarak gösterilir. Her gün için bir tek ürün.
          </p>
        </div>
      </div>

      <DailyDealClient initialDeals={deals as any} items={items as any} />
    </div>
  );
}
