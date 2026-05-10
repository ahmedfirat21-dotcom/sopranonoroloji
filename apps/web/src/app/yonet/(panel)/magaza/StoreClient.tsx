"use client";

import React, { useState, useTransition, useId, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Star, Smartphone, X, Upload, Sliders, FileJson, Image as ImageIcon } from 'lucide-react';
import { CATEGORIES, getCategoryDef } from './categories';
import MobilePreview from './MobilePreview';
import BulkUploadModal from './BulkUploadModal';
import { useAdminDialog } from '../../_components/AdminDialog';
import ItemLottiePreview from '@/components/store/ItemLottiePreview';

type Item = {
  id: string;
  category: string;
  rarity: string | null;
  name: string;
  tagline: string | null;
  art_emoji: string | null;
  art_color: string | null;
  bg_gradient_start: string | null;
  bg_gradient_end: string | null;
  price_sp: number;
  per_message: boolean | null;
  is_featured: boolean | null;
  collection_id: string | null;
  active: boolean | null;
  display_order: number | null;
  asset_url?: string | null; // ★ v114 — Lottie/PNG URL (mobile dinamik render)
};

type Bundle = {
  id: string;
  name: string;
  tagline: string | null;
  art_emoji: string | null;
  rarity: string | null;
  total_price_sp: number;
  discount_pct: number | null;
  sort_order: number | null;
  active: boolean | null;
};

type Tab = 'items' | 'bundles';

export default function StoreClient({
  initialItems,
  initialBundles,
}: {
  initialItems: Item[];
  initialBundles: Bundle[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dialog = useAdminDialog();
  const [tab, setTab] = useState<Tab>('items');
  const [items, setItems] = useState(initialItems);
  const [bundles, setBundles] = useState(initialBundles);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [creating, setCreating] = useState(false);
  const [previewItem, setPreviewItem] = useState<Item | null>(null);
  // ★ 2026-05-11: URL'den ?cat=frames gibi parametre okur — eski cerceveler/giris-efektleri
  //   sayfalarından redirect olunca filter otomatik açılır.
  const [categoryFilter, setCategoryFilter] = useState<string>(() => searchParams.get('cat') || 'all');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [, startTransition] = useTransition();

  // URL değişince filter güncellesin (geri/ileri navigation)
  useEffect(() => {
    const cat = searchParams.get('cat');
    if (cat && cat !== categoryFilter) setCategoryFilter(cat);
  }, [searchParams, categoryFilter]);

  const callItemAction = async (id: string, body: any) => {
    setBusyId(id);
    try {
      const res = await fetch(`/yonet/api/store/items/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'İşlem başarısız');
      }
      if (body.delete) {
        setItems(prev => prev.filter(i => i.id !== id));
      } else if (body.update) {
        setItems(prev => prev.map(i => i.id === id ? { ...i, ...body.update } : i));
      }
      startTransition(() => router.refresh());
    } catch (e: any) {
      await dialog.alert({ title: 'Hata', message: e.message, variant: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  // ★ v110.14: Silme öncesi bağımlılık check + bilinçli onay
  const confirmAndDelete = async (item: Item) => {
    let counts = { bundles: 0, inventories: 0, deals: 0 };
    try {
      const res = await fetch(`/yonet/api/store/items/${encodeURIComponent(item.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delete_check: true }),
      });
      const j = await res.json();
      if (j?.counts) counts = j.counts;
    } catch { /* preflight başarısız — varsayılan 0'larla devam */ }

    let message = `"${item.name}" mağazadan kalıcı olarak kaldırılacak.`;
    const warnings: string[] = [];
    if (counts.inventories > 0) warnings.push(`⚠️ ${counts.inventories} kullanıcı bu ürünü satın almış — onların envanterinden de silinecek (geri alınamaz)`);
    if (counts.bundles > 0) warnings.push(`📦 ${counts.bundles} paketten çıkarılacak`);
    if (counts.deals > 0) warnings.push(`⚡ ${counts.deals} günün fırsatı kaldırılacak`);
    if (warnings.length > 0) message += '\n\n' + warnings.join('\n');

    const ok = await dialog.confirm({
      title: `"${item.name}" silinecek`,
      message,
      confirmLabel: 'Sil',
      danger: true,
    });
    if (!ok) return;
    callItemAction(item.id, { delete: true });
  };

  const callBundleToggle = async (id: string, active: boolean) => {
    setBusyId(id);
    try {
      const res = await fetch(`/yonet/api/store/bundles/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ update: { active } }),
      });
      if (!res.ok) throw new Error('İşlem başarısız');
      setBundles(prev => prev.map(b => b.id === id ? { ...b, active } : b));
      startTransition(() => router.refresh());
    } catch (e: any) {
      await dialog.alert({ title: 'Hata', message: e.message, variant: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => setTab('items')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'items'
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200'
              : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
          }`}
        >
          Ürünler ({items.length})
        </button>
        <button
          onClick={() => setTab('bundles')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'bundles'
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200'
              : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
          }`}
        >
          Paketler ({bundles.length})
        </button>
        <div className="ml-auto flex items-center gap-2">
          {tab === 'items' && (
            <>
              <button
                type="button"
                onClick={() => setBulkOpen(true)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="JSON dosyası ile toplu yedekle / aktar"
              >
                <Upload className="w-3.5 h-3.5" /> Toplu İçe Aktar
              </button>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="px-5 py-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-200 hover:bg-amber-500/30 text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/10"
                title="Yeni ürün ekle (kategori seç + dosya yükle + ayarla)"
              >
                <Plus className="w-4 h-4" /> Yeni Ürün
              </button>
            </>
          )}
        </div>
      </div>

      {tab === 'items' && (() => {
        // Mevcut kategorileri öne çıkar (DB'de kayıt olanlar), sonra diğerleri.
        const counts = new Map<string, number>();
        for (const it of items) counts.set(it.category, (counts.get(it.category) || 0) + 1);
        const known = CATEGORIES.filter(c => counts.has(c.slug));
        const unknown = Array.from(counts.keys()).filter(s => !CATEGORIES.some(c => c.slug === s));
        const filteredItems = categoryFilter === 'all'
          ? items
          : items.filter(i => i.category === categoryFilter);
        return (
          <>
            {/* Kategori filtresi */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                Tümü ({items.length})
              </button>
              {known.map(c => (
                <button
                  type="button"
                  key={c.slug}
                  onClick={() => setCategoryFilter(c.slug)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                    categoryFilter === c.slug
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                  title={c.description}
                >
                  <span>{c.emoji}</span>
                  {c.label} ({counts.get(c.slug)})
                </button>
              ))}
              {unknown.map(slug => (
                <button
                  type="button"
                  key={slug}
                  onClick={() => setCategoryFilter(slug)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    categoryFilter === slug
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {slug} ({counts.get(slug)})
                </button>
              ))}
            </div>

        {/* Mobile: kart grid */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredItems.map(it => {
            const isBusy = busyId === it.id;
            const catDef = getCategoryDef(it.category);
            return (
              <div
                key={it.id}
                className="rounded-xl border bg-white/5 p-3"
                style={{ borderColor: it.bg_gradient_start ? `${it.bg_gradient_start}40` : 'rgba(255,255,255,0.1)' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                    style={{
                      background: it.bg_gradient_start && it.bg_gradient_end
                        ? `linear-gradient(135deg, ${it.bg_gradient_start}, ${it.bg_gradient_end})`
                        : '#1e293b',
                    }}
                  >
                    <ItemLottiePreview itemId={it.id} fallbackEmoji={it.art_emoji} size={48} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-100 truncate flex items-center gap-1.5">
                      {it.name}
                      {it.is_featured && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {catDef.emoji} {catDef.label}
                    </div>
                  </div>
                  {it.active ? (
                    <span className="px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[9px] font-bold">AKTİF</span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400 text-[9px] font-bold">PASİF</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider ${rarityStyle(it.rarity)}`}>
                    {rarityLabel(it.rarity)}
                  </span>
                  <span className="text-amber-300 font-mono">{it.price_sp.toLocaleString('tr-TR')} SP</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewItem(it)}
                    className="px-1 py-1.5 rounded-md text-[10px] font-semibold border bg-violet-500/10 border-violet-500/30 text-violet-300 flex items-center justify-center"
                    title="Önizle"
                  >
                    <Smartphone className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => callItemAction(it.id, { update: { active: !it.active } })}
                    disabled={isBusy}
                    className="px-1 py-1.5 rounded-md text-[10px] font-semibold border bg-white/5 border-white/10 text-slate-300 flex items-center justify-center"
                  >
                    {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : (it.active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(it)}
                    disabled={isBusy}
                    className="px-1 py-1.5 rounded-md text-[10px] font-semibold border bg-cyan-500/10 border-cyan-500/30 text-cyan-300 flex items-center justify-center"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmAndDelete(it)}
                    disabled={isBusy}
                    className="px-1 py-1.5 rounded-md text-[10px] font-semibold border bg-red-500/10 border-red-500/30 text-red-300 flex items-center justify-center"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredItems.length === 0 && (
            <div className="col-span-full bg-white/5 border border-white/10 rounded-xl p-8 text-center text-slate-500 text-sm">
              {categoryFilter === 'all' ? 'Henüz ürün yok.' : 'Bu kategoride ürün yok.'}
            </div>
          )}
        </div>

        {/* Desktop: tablo */}
        <div className="hidden lg:block bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-[10px] tracking-wider text-slate-400">
                <tr>
                  <th className="text-left px-5 py-3">ÜRÜN</th>
                  <th className="text-left px-3 py-3">KATEGORİ</th>
                  <th className="text-left px-3 py-3">NADİRLİK</th>
                  <th className="text-right px-3 py-3">FİYAT</th>
                  <th className="text-center px-3 py-3">DURUM</th>
                  <th className="text-right px-5 py-3">AKSİYONLAR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredItems.map(it => {
                  const isBusy = busyId === it.id;
                  const catDef = getCategoryDef(it.category);
                  return (
                    <tr key={it.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden"
                            style={{
                              background: it.bg_gradient_start && it.bg_gradient_end
                                ? `linear-gradient(135deg, ${it.bg_gradient_start}, ${it.bg_gradient_end})`
                                : '#1e293b',
                            }}
                          >
                            <ItemLottiePreview itemId={it.id} fallbackEmoji={it.art_emoji} size={36} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-100 truncate flex items-center gap-1.5">
                              {it.name}
                              {it.is_featured && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">{it.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <span>{catDef.emoji}</span> {catDef.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${rarityStyle(it.rarity)}`}>
                          {rarityLabel(it.rarity)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-amber-300 font-mono text-xs">
                        {it.price_sp.toLocaleString('tr-TR')} SP
                      </td>
                      <td className="px-3 py-3 text-center">
                        {it.active ? (
                          <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold">AKTİF</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400 text-[10px] font-bold">PASİF</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewItem(it)}
                            className="px-2 py-1.5 rounded-md text-[10px] font-semibold border bg-violet-500/10 border-violet-500/30 text-violet-300 hover:bg-violet-500/20 transition-colors flex items-center gap-1"
                            title="Mobilde nasıl görünüyor?"
                          >
                            <Smartphone className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => callItemAction(it.id, { update: { active: !it.active } })}
                            disabled={isBusy}
                            className="px-2 py-1.5 rounded-md text-[10px] font-semibold border bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 transition-colors flex items-center gap-1"
                            title={it.active ? 'Pasifleştir' : 'Aktifleştir'}
                          >
                            {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : (it.active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />)}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(it)}
                            disabled={isBusy}
                            className="px-2 py-1.5 rounded-md text-[10px] font-semibold border bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                            title="Düzenle (tüm ayarlar tek yerde)"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmAndDelete(it)}
                            disabled={isBusy}
                            className="px-2 py-1.5 rounded-md text-[10px] font-semibold border bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm">
                      <div className="text-slate-500 mb-3">
                        {categoryFilter === 'all' ? 'Henüz ürün yok.' : 'Bu kategoride ürün yok.'}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCreating(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-200 text-sm font-bold hover:bg-amber-500/30 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {categoryFilter === 'all'
                          ? 'İlk ürünü ekle'
                          : `${getCategoryDef(categoryFilter).emoji} İlk ${getCategoryDef(categoryFilter).label} ürününü ekle`}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
          </>
        );
      })()}

      {tab === 'bundles' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] text-[10px] tracking-wider text-slate-400">
              <tr>
                <th className="text-left px-5 py-3">PAKET</th>
                <th className="text-right px-3 py-3">FİYAT</th>
                <th className="text-right px-3 py-3">İNDİRİM</th>
                <th className="text-center px-3 py-3">DURUM</th>
                <th className="text-right px-5 py-3">AKSİYON</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bundles.map(b => (
                <tr key={b.id} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-lg">
                        {b.art_emoji || '🎁'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100">{b.name}</div>
                        <div className="text-xs text-slate-500">{b.tagline}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-amber-300 font-mono text-xs">
                    {b.total_price_sp.toLocaleString('tr-TR')} SP
                  </td>
                  <td className="px-3 py-3 text-right text-cyan-300 font-mono text-xs">
                    %{b.discount_pct || 0}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {b.active ? (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold">AKTİF</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400 text-[10px] font-bold">PASİF</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => callBundleToggle(b.id, !b.active)}
                      disabled={busyId === b.id}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold border bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 transition-colors"
                    >
                      {b.active ? 'Pasifleştir' : 'Aktifleştir'}
                    </button>
                  </td>
                </tr>
              ))}
              {bundles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500 text-sm">
                    Henüz paket yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {(editing || creating) && (
        <ItemEditModal
          item={editing}
          /* Yeni ürün modu için aktif kategori filtresini ön-doldur */
          defaultCategory={creating && categoryFilter !== 'all' ? categoryFilter : undefined}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={(saved, isNew) => {
            if (isNew) setItems(prev => [saved, ...prev]);
            else setItems(prev => prev.map(i => i.id === saved.id ? saved : i));
            setEditing(null);
            setCreating(false);
            startTransition(() => router.refresh());
          }}
        />
      )}

      {bulkOpen && (
        <BulkUploadModal
          onClose={() => setBulkOpen(false)}
          onUploaded={() => {
            // Sayfa yenile — yeni eklenen ürünleri Supabase'den taze çek
            startTransition(() => router.refresh());
          }}
        />
      )}

      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-auto">
          <div className="bg-slate-900 border border-white/10 rounded-xl sm:rounded-2xl w-full max-w-md my-2 sm:my-8 relative">
            <button
              type="button"
              onClick={() => setPreviewItem(null)}
              className="absolute top-3 right-3 z-10 text-slate-400 hover:text-slate-200 bg-black/40 rounded-full w-8 h-8 flex items-center justify-center"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="p-1">
              <MobilePreview item={previewItem} />
            </div>
            <div className="px-5 pb-5 text-center text-xs text-slate-400">
              <strong className="text-slate-200">{previewItem.name}</strong>
              {previewItem.tagline && <> · {previewItem.tagline}</>}
              <br />
              <span className="text-amber-300 font-mono">{previewItem.price_sp.toLocaleString('tr-TR')} SP</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function rarityStyle(rarity: string | null): string {
  switch (rarity) {
    case 'mythic': return 'bg-fuchsia-500/15 border border-fuchsia-500/40 text-fuchsia-300';
    case 'legendary': return 'bg-amber-500/15 border border-amber-500/40 text-amber-300';
    case 'epic': return 'bg-violet-500/15 border border-violet-500/40 text-violet-300';
    case 'rare': return 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300';
    default: return 'bg-slate-500/10 border border-slate-500/30 text-slate-400';
  }
}

function rarityLabel(rarity: string | null): string {
  switch (rarity) {
    case 'mythic': return 'EFSANEVİ';
    case 'legendary': return 'EFSANE';
    case 'epic': return 'DESTANSI';
    case 'rare': return 'NADİR';
    case 'common': return 'SIRADAN';
    default: return (rarity || 'sıradan').toUpperCase();
  }
}

// Kategoriye göre asset format ipucu — neyin yüklenmesi gerektiğini açık söyler
const ASSET_FORMAT_HINTS: Record<string, { recommended: string; tip: string }> = {
  frames:        { recommended: 'PNG (şeffaf zemin, kare) veya Lottie JSON',     tip: '512×512 px önerilir' },
  entry_effect:  { recommended: 'Lottie JSON (animasyonlu)',                      tip: 'Veya GIF/WebP fallback' },
  gift:          { recommended: 'Lottie JSON veya PNG',                           tip: 'Sohbete gönderildiğinde oynayacak' },
  glow_message:  { recommended: 'Küçük PNG/SVG',                                  tip: 'Mesaj baloncuğu efekti' },
  effect:        { recommended: 'Lottie JSON',                                    tip: 'Genel görsel efekt' },
  theme:         { recommended: 'PNG/JPG arkaplan',                               tip: '1080×1920 önerilir' },
  background:    { recommended: 'PNG/JPG arkaplan',                               tip: 'Profil/oda arkaplanı' },
  emoji:         { recommended: 'PNG (şeffaf zemin)',                             tip: '128×128 önerilir' },
  badge:         { recommended: 'PNG/SVG (şeffaf zemin)',                         tip: '128×128 rozet ikonu' },
};

function ItemEditModal({
  item,
  defaultCategory,
  onClose,
  onSaved,
}: {
  item: Item | null;
  defaultCategory?: string;
  onClose: () => void;
  onSaved: (saved: Item, isNew: boolean) => void;
}) {
  const dialog = useAdminDialog();
  const isNew = !item;
  const [form, setForm] = useState<Partial<Item>>(
    item || {
      id: '',
      category: defaultCategory || 'frames',
      rarity: 'common',
      name: '',
      tagline: '',
      art_emoji: '✨',
      art_color: '#fbbf24',
      bg_gradient_start: '#1e293b',
      bg_gradient_end: '#0f172a',
      price_sp: 100,
      per_message: false,
      is_featured: false,
      active: true,
      display_order: 0,
    }
  );
  const [saving, setSaving] = useState(false);

  // Yeni ürün için ID otomatik üret — isim + kategori + zaman damgası
  useEffect(() => {
    if (!isNew) return;
    if (!form.name) return;
    const slug = form.name
      .toLowerCase()
      .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30);
    if (!slug) return;
    const stamp = Date.now().toString(36).slice(-4);
    const newId = `${form.category}_${slug}_${stamp}`;
    setForm(prev => prev.id === newId ? prev : { ...prev, id: newId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name, form.category]);

  // Asset upload state — modal içi yükleme akışı
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedType, setUploadedType] = useState<'lottie' | 'image' | null>(
    item?.asset_url ? (item.asset_url.endsWith('.json') ? 'lottie' : 'image') : null
  );

  const formatHint = ASSET_FORMAT_HINTS[form.category || ''] ?? {
    recommended: 'PNG, Lottie JSON, SVG, GIF veya WebP',
    tip: 'Maks 10 MB',
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      await dialog.alert({ title: 'Dosya çok büyük', message: 'Maks 10 MB olabilir.', variant: 'error' });
      return;
    }
    const allowed = ['application/json', 'image/png', 'image/jpeg', 'image/svg+xml', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      await dialog.alert({
        title: 'Geçersiz tip',
        message: `${file.type} kabul edilmiyor. JSON (Lottie), PNG, JPG, SVG, GIF veya WebP olabilir.`,
        variant: 'error',
      });
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', form.category || 'other');
      // ★ Yeni ürün ise henüz id yok — sadece Storage'a yükle, asset_url'i form'a koy
      //   ve kayıt sırasında DB'ye yazılsın. Mevcut ürün ise item_id ile DB autoupdate.
      if (!isNew && form.id) fd.append('item_id', form.id);

      const res = await fetch('/yonet/api/store/upload-asset', { method: 'POST', body: fd });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || 'Yükleme başarısız');

      setForm(prev => ({ ...prev, asset_url: j.url }));
      setUploadedType(j.asset_type);
    } catch (e: any) {
      await dialog.alert({ title: 'Yükleme hatası', message: e.message, variant: 'error' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearAsset = () => {
    setForm(prev => ({ ...prev, asset_url: null }));
    setUploadedType(null);
  };

  const handleSave = async () => {
    if (!form.id || !form.name) {
      await dialog.alert({ title: 'Eksik bilgi', message: 'ID ve isim gerekli.', variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      const url = isNew
        ? `/yonet/api/store/items`
        : `/yonet/api/store/items/${encodeURIComponent(item!.id)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isNew ? { create: form } : { update: form }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'İşlem başarısız');
      }
      const j = await res.json();
      onSaved(j.item || form as Item, isNew);
    } catch (e: any) {
      await dialog.alert({ title: 'Hata', message: e.message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const update = (k: keyof Item, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  // İnce ayar deeplink — frame ve entry effect için ayrı detaylı sayfaları var
  const fineConfigUrl =
    form.category === 'frames' || form.category === 'atelier'
      ? `/yonet/cerceveler/${form.id}`
      : form.category === 'entry_effect'
        ? `/yonet/giris-efektleri/${form.id}`
        : null;

  // Önizleme objesi — formun anlık halini MobilePreview'a verir
  const previewItem = {
    id: form.id || 'preview',
    category: form.category || 'frames',
    rarity: form.rarity || null,
    name: form.name || 'Ürün adı',
    tagline: form.tagline || null,
    art_emoji: form.art_emoji || '✨',
    art_color: form.art_color || '#fbbf24',
    bg_gradient_start: form.bg_gradient_start || '#1e293b',
    bg_gradient_end: form.bg_gradient_end || '#0f172a',
    price_sp: form.price_sp ?? 0,
    asset_url: form.asset_url || null,
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-auto">
      <div className="bg-slate-900 border border-white/10 rounded-xl sm:rounded-2xl w-full max-w-5xl my-2 sm:my-8">
        {/* Başlık */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900 z-10 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              {isNew ? (
                <><Plus className="w-5 h-5 text-amber-400" /> Yeni Ürün</>
              ) : (
                <><Pencil className="w-4 h-4 text-cyan-400" /> Düzenle — {item!.name}</>
              )}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Kategori seç · dosya yükle · ayarları gir · sağda canlı önizle
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl w-8 h-8 flex items-center justify-center" aria-label="Kapat">✕</button>
        </div>

        {/* Gövde — sol form, sağ önizleme */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-0">
          {/* SOL — form */}
          <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* 1) Kategori chip seçici — en üstte, vurgulu */}
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-amber-300 mb-2">
                1. KATEGORİ <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(c => {
                  const active = form.category === c.slug;
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => update('category', c.slug)}
                      disabled={!isNew}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                        active
                          ? 'bg-amber-500/25 border-amber-500/60 text-amber-200'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={isNew ? c.description : 'Mevcut ürünün kategorisi değiştirilemez'}
                    >
                      <span>{c.emoji}</span> {c.label}
                    </button>
                  );
                })}
              </div>
              {!isNew && (
                <div className="text-[10px] text-slate-500 mt-1.5">
                  Mevcut ürünün kategorisi değiştirilemez (envanter bütünlüğü için).
                </div>
              )}
            </div>

            {/* 2) Asset upload — kategoriye özel format ipucu */}
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-amber-300 mb-2 flex items-center justify-between">
                <span>2. DOSYA <span className="text-slate-500 font-normal text-[9px] ml-1">(opsiyonel)</span></span>
                <span className="text-[9px] font-normal normal-case text-amber-300/80">
                  💡 {formatHint.recommended}
                </span>
              </label>
              {!form.asset_url ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="border-2 border-dashed border-white/15 rounded-xl p-5 text-center cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-colors"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                      <span className="text-xs text-slate-400">Yükleniyor...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 text-slate-500 mx-auto mb-2" />
                      <div className="text-sm text-slate-300 font-semibold">Dosya seç veya sürükle</div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Lottie (.json) · PNG · JPG · SVG · GIF · WebP — max 10 MB
                      </div>
                      <div className="text-[10px] text-amber-300/70 mt-1">{formatHint.tip}</div>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json,image/png,image/jpeg,image/svg+xml,image/gif,image/webp"
                    aria-label="Asset dosyası"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    {uploadedType === 'lottie' ? (
                      <FileJson className="w-5 h-5 text-emerald-300" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-emerald-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-emerald-200">
                      {uploadedType === 'lottie' ? 'Lottie animasyon' : 'Görsel'} bağlı ✓
                    </div>
                    <a
                      href={form.asset_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-cyan-300 underline truncate block"
                    >
                      {form.asset_url.split('/').pop()}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1 rounded-md text-[10px] font-semibold bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 flex items-center gap-1"
                    title="Yenisini yükle"
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    Değiştir
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAsset}
                    className="w-7 h-7 rounded-md bg-red-500/15 border border-red-500/40 text-red-300 flex items-center justify-center hover:bg-red-500/25"
                    title="Kaldır"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json,image/png,image/jpeg,image/svg+xml,image/gif,image/webp"
                    aria-label="Asset dosyası"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* 3) Temel bilgiler */}
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-amber-300 mb-2">
                3. TEMEL BİLGİLER
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Field label="İsim">
                  <input
                    type="text"
                    value={form.name || ''}
                    onChange={e => update('name', e.target.value)}
                    placeholder="ör. Altın Çerçeve"
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none text-sm"
                  />
                </Field>
                <Field label="Nadirlik">
                  <select
                    title="Nadirlik"
                    aria-label="Nadirlik"
                    value={form.rarity || ''}
                    onChange={e => update('rarity', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none text-sm"
                  >
                    <option value="common">Sıradan</option>
                    <option value="rare">Nadir</option>
                    <option value="epic">Destansı</option>
                    <option value="legendary">Efsane</option>
                    <option value="mythic">Efsanevi</option>
                  </select>
                </Field>
                <Field label="Slogan" full>
                  <input
                    type="text"
                    value={form.tagline || ''}
                    onChange={e => update('tagline', e.target.value)}
                    placeholder="Kısa açıklama"
                    maxLength={60}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none text-sm"
                  />
                </Field>
                <Field label="Fiyat (SP)">
                  <input
                    type="number"
                    title="Fiyat (SP)"
                    placeholder="100"
                    value={form.price_sp ?? 0}
                    onChange={e => update('price_sp', parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none text-sm font-mono"
                  />
                </Field>
                <Field label="Emoji">
                  <input
                    type="text"
                    value={form.art_emoji || ''}
                    onChange={e => update('art_emoji', e.target.value)}
                    maxLength={4}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none text-sm text-center text-lg"
                  />
                </Field>
              </div>
            </div>

            {/* 4) Renk / Gradient */}
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-amber-300 mb-2">
                4. RENK / GRADIENT
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Başlangıç">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      title="Başlangıç rengi"
                      aria-label="Başlangıç rengi"
                      value={form.bg_gradient_start || '#1e293b'}
                      onChange={e => update('bg_gradient_start', e.target.value)}
                      className="w-9 h-9 rounded cursor-pointer bg-transparent border border-white/10"
                    />
                    <input
                      type="text"
                      title="Başlangıç hex kodu"
                      value={form.bg_gradient_start || ''}
                      onChange={e => update('bg_gradient_start', e.target.value)}
                      placeholder="#1e293b"
                      className="flex-1 px-2 py-1.5 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none font-mono text-xs"
                    />
                  </div>
                </Field>
                <Field label="Bitiş">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      title="Bitiş rengi"
                      aria-label="Bitiş rengi"
                      value={form.bg_gradient_end || '#0f172a'}
                      onChange={e => update('bg_gradient_end', e.target.value)}
                      className="w-9 h-9 rounded cursor-pointer bg-transparent border border-white/10"
                    />
                    <input
                      type="text"
                      title="Bitiş hex kodu"
                      value={form.bg_gradient_end || ''}
                      onChange={e => update('bg_gradient_end', e.target.value)}
                      placeholder="#0f172a"
                      className="flex-1 px-2 py-1.5 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none font-mono text-xs"
                    />
                  </div>
                </Field>
              </div>
            </div>

            {/* 5) Durum + Toggle'lar */}
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-amber-300 mb-2">
                5. DURUM
              </label>
              <div className="flex items-center gap-5 flex-wrap">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={!!form.active} onChange={e => update('active', e.target.checked)} />
                  <span className="text-slate-200">Yayında</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={!!form.is_featured} onChange={e => update('is_featured', e.target.checked)} />
                  <span className="text-slate-200 flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400" /> Öne çıkan
                  </span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={!!form.per_message} onChange={e => update('per_message', e.target.checked)} />
                  <span className="text-slate-200">Her mesajda kullanılır</span>
                </label>
              </div>
            </div>

            {/* İleri ayarlar — ID + sıra + koleksiyon (collapsible) */}
            <details className="group">
              <summary className="cursor-pointer text-[10px] font-bold tracking-wider text-slate-400 hover:text-slate-200 transition-colors select-none">
                ⚙ İLERİ AYARLAR (ID, sıra, koleksiyon)
              </summary>
              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/5">
                <Field label="ID (slug)" full disabled={!isNew}>
                  <input
                    type="text"
                    value={form.id || ''}
                    onChange={e => update('id', e.target.value)}
                    disabled={!isNew}
                    placeholder="otomatik oluşturulur"
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none disabled:opacity-50 font-mono text-xs"
                  />
                  {isNew && <div className="text-[10px] text-slate-500 mt-1">İsim yazınca otomatik üretilir; istersen değiştirebilirsin.</div>}
                </Field>
                <Field label="Sıra">
                  <input
                    type="number"
                    value={form.display_order ?? 0}
                    onChange={e => update('display_order', parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none text-sm"
                  />
                </Field>
                <Field label="Koleksiyon ID">
                  <input
                    type="text"
                    value={form.collection_id || ''}
                    onChange={e => update('collection_id', e.target.value)}
                    placeholder="opsiyonel"
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none text-sm"
                  />
                </Field>
              </div>
            </details>

            {/* İnce ayar deeplink — sadece kayıtlı ürün ve frame/entry kategorisi */}
            {!isNew && fineConfigUrl && (
              <a
                href={fineConfigUrl}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-500/20 text-sm font-semibold transition-colors"
                title="Detaylı slider'lı yapılandırma sayfası"
              >
                <Sliders className="w-4 h-4" />
                <div className="flex-1">
                  <div>İnce Ayar Sayfasına Git</div>
                  <div className="text-[10px] text-fuchsia-400/70 font-normal">
                    {form.category === 'entry_effect' ? 'Avatar pozisyonu, animasyon hızı, loop ayarları' : 'Frame ölçek, glow, renk filtreleri'}
                  </div>
                </div>
                <span className="text-lg">→</span>
              </a>
            )}
          </div>

          {/* SAĞ — canlı mobil önizleme */}
          <div className="border-t lg:border-t-0 lg:border-l border-white/10 p-4 bg-black/20">
            <div className="text-[10px] tracking-wider text-slate-400 mb-3 font-bold text-center">
              📱 CANLI ÖNİZLEME
            </div>
            <div className="scale-90 origin-top sticky top-4">
              <MobilePreview item={previewItem} />
            </div>
          </div>
        </div>

        {/* Aksiyon */}
        <div className="px-5 py-4 border-t border-white/10 flex justify-end gap-2 sticky bottom-0 bg-slate-900 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.name}
            className="px-5 py-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-200 text-sm font-bold hover:bg-amber-500/30 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isNew ? 'Mağazaya Ekle' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full, disabled }: { label: string; children: React.ReactNode; full?: boolean; disabled?: boolean }) {
  const id = useId();
  // Child input/select'e id + aria-label inject et — accessibility için
  const childWithId = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, { id, 'aria-label': label })
    : children;
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label
        htmlFor={id}
        className={`block text-[10px] font-semibold tracking-wider mb-1 ${disabled ? 'text-slate-600' : 'text-slate-400'}`}
      >
        {label.toUpperCase()}
      </label>
      {childWithId}
    </div>
  );
}
