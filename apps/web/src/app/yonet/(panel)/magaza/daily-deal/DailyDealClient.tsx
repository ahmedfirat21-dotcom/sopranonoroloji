"use client";

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2, Save, Calendar, Tag, Percent } from 'lucide-react';
import { useAdminDialog } from '../../../_components/AdminDialog';

type Deal = {
  deal_date: string;
  item_id: string;
  extra_discount_pct: number;
  banner_text: string | null;
  created_at: string;
};

type Item = {
  id: string;
  name: string;
  category: string;
  rarity: string | null;
  price_sp: number;
  art_emoji: string | null;
  art_color: string | null;
  active: boolean;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DailyDealClient({
  initialDeals,
  items,
}: {
  initialDeals: Deal[];
  items: Item[];
}) {
  const router = useRouter();
  const dialog = useAdminDialog();
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [, startTransition] = useTransition();

  const today = todayIso();
  const todayDeal = useMemo(() => deals.find((d) => d.deal_date === today), [deals, today]);

  // Form state
  const [dealDate, setDealDate] = useState<string>(today);
  const [itemId, setItemId] = useState<string>(todayDeal?.item_id || '');
  const [discount, setDiscount] = useState<number>(todayDeal?.extra_discount_pct ?? 25);
  const [bannerText, setBannerText] = useState<string>(todayDeal?.banner_text ?? '');
  const [saving, setSaving] = useState(false);
  const [busyDate, setBusyDate] = useState<string | null>(null);

  // Tarih değişince mevcut deal varsa otomatik doldur
  const handleDateChange = (newDate: string) => {
    setDealDate(newDate);
    const existing = deals.find((d) => d.deal_date === newDate);
    if (existing) {
      setItemId(existing.item_id);
      setDiscount(existing.extra_discount_pct);
      setBannerText(existing.banner_text || '');
    }
  };

  const handleSave = async () => {
    if (!itemId) {
      await dialog.alert({ title: 'Ürün seç', message: 'Daily deal için bir ürün seç.', variant: 'error' });
      return;
    }
    if (discount < 0 || discount > 80) {
      await dialog.alert({ title: 'Geçersiz indirim', message: '0-80 arası bir değer gir.', variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/yonet/api/store/daily-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_date: dealDate,
          item_id: itemId,
          extra_discount_pct: discount,
          banner_text: bannerText.trim(),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Kayıt başarısız');
      }
      // Local state'i güncelle
      setDeals((prev) => {
        const filtered = prev.filter((d) => d.deal_date !== dealDate);
        return [
          {
            deal_date: dealDate,
            item_id: itemId,
            extra_discount_pct: discount,
            banner_text: bannerText.trim(),
            created_at: new Date().toISOString(),
          },
          ...filtered,
        ].sort((a, b) => b.deal_date.localeCompare(a.deal_date));
      });
      startTransition(() => router.refresh());
      await dialog.alert({
        title: 'Kaydedildi',
        message: dealDate === today
          ? 'Bugünün fırsatı güncellendi — mağazada anında görünür.'
          : `${dealDate} tarihli fırsat kaydedildi.`,
        variant: 'success',
      });
    } catch (e: any) {
      await dialog.alert({ title: 'Hata', message: e.message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (date: string) => {
    const ok = await dialog.confirm({
      title: `${date} fırsatı silinecek`,
      message: 'Bu tarihteki daily deal kaydı silinir. O gün için banner gösterilmez.',
      confirmLabel: 'Sil',
      danger: true,
    });
    if (!ok) return;
    setBusyDate(date);
    try {
      const res = await fetch(`/yonet/api/store/daily-deal?date=${date}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Silinemedi');
      }
      setDeals((prev) => prev.filter((d) => d.deal_date !== date));
      startTransition(() => router.refresh());
    } catch (e: any) {
      await dialog.alert({ title: 'Hata', message: e.message, variant: 'error' });
    } finally {
      setBusyDate(null);
    }
  };

  const selectedItem = items.find((i) => i.id === itemId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form kartı */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h2 className="text-sm font-bold tracking-wider text-pink-300 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Yeni / Düzenle
        </h2>

        <label className="block text-[11px] font-semibold tracking-wider text-slate-400 mb-1">TARİH</label>
        <input
          type="date"
          value={dealDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 focus:border-pink-500/50 focus:outline-none text-slate-100 text-sm mb-4"
        />

        <label className="block text-[11px] font-semibold tracking-wider text-slate-400 mb-1">ÜRÜN</label>
        <select
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 focus:border-pink-500/50 focus:outline-none text-slate-100 text-sm mb-4"
          aria-label="Ürün seç"
        >
          <option value="">— Ürün seç —</option>
          {items.map((it) => (
            <option key={it.id} value={it.id}>
              {it.art_emoji} {it.name} ({it.category} · {it.price_sp} SP)
            </option>
          ))}
        </select>

        {selectedItem && (
          <div className="bg-pink-500/5 border border-pink-500/20 rounded-lg p-3 mb-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
              style={{ background: `${selectedItem.art_color || '#fbbf24'}20`, border: `1px solid ${selectedItem.art_color || '#fbbf24'}40` }}
            >
              {selectedItem.art_emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-100 truncate">{selectedItem.name}</div>
              <div className="text-xs text-slate-400">{selectedItem.category} · {selectedItem.price_sp} SP</div>
            </div>
          </div>
        )}

        <label className="block text-[11px] font-semibold tracking-wider text-slate-400 mb-1">EK İNDİRİM (% 0-80)</label>
        <div className="flex items-center gap-2 mb-4">
          <input
            type="number"
            min={0}
            max={80}
            value={discount}
            onChange={(e) => setDiscount(parseInt(e.target.value, 10) || 0)}
            className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 focus:border-pink-500/50 focus:outline-none text-slate-100 text-sm"
          />
          <Percent className="w-4 h-4 text-slate-500" />
        </div>

        <label className="block text-[11px] font-semibold tracking-wider text-slate-400 mb-1">BANNER METNİ</label>
        <textarea
          value={bannerText}
          onChange={(e) => setBannerText(e.target.value)}
          placeholder="Yepyeni AI Spark — bugün %25 ek indirimde, sahneye akıllı zekayla gir!"
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 focus:border-pink-500/50 focus:outline-none text-slate-100 text-sm mb-4 resize-none"
        />

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full px-4 py-3 rounded-lg bg-pink-500/15 border border-pink-500/40 text-pink-200 text-sm font-semibold hover:bg-pink-500/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {dealDate === today ? 'Bugünün Fırsatını Kaydet' : `${dealDate} Fırsatını Kaydet`}
        </button>
      </div>

      {/* Liste */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h2 className="text-sm font-bold tracking-wider text-slate-300 mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-cyan-400" /> Geçmiş ({deals.length})
        </h2>
        <div className="space-y-2 max-h-[600px] overflow-y-auto yonet-scrollbar pr-1">
          {deals.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-4 text-center">
              Henüz daily deal kaydı yok.
            </div>
          ) : (
            deals.map((d) => {
              const item = items.find((i) => i.id === d.item_id);
              const isToday = d.deal_date === today;
              const isFuture = d.deal_date > today;
              const isBusy = busyDate === d.deal_date;
              return (
                <div
                  key={d.deal_date}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isToday
                      ? 'bg-pink-500/10 border-pink-500/30'
                      : isFuture
                      ? 'bg-cyan-500/5 border-cyan-500/20'
                      : 'bg-white/[0.02] border-white/5'
                  }`}
                >
                  <div className="text-xs font-mono text-slate-300 w-20 shrink-0">
                    {d.deal_date}
                    {isToday && (
                      <div className="text-[9px] text-pink-300 font-bold mt-0.5">BUGÜN</div>
                    )}
                    {isFuture && (
                      <div className="text-[9px] text-cyan-300 font-bold mt-0.5">İLERİDE</div>
                    )}
                  </div>
                  <div className="text-lg shrink-0">{item?.art_emoji || '✦'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-100 truncate">
                      {item?.name || d.item_id}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      %{d.extra_discount_pct} ek indirim · {d.banner_text || '—'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(d.deal_date)}
                    disabled={isBusy}
                    className="px-2 py-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 disabled:opacity-50 transition-colors shrink-0"
                    title="Sil"
                  >
                    {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
