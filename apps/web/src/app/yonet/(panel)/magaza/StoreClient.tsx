"use client";

import React, { useState, useTransition, useId } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Star, Smartphone, X, Zap, Upload } from 'lucide-react';
import { CATEGORIES, getCategoryDef } from './categories';
import MobilePreview from './MobilePreview';
import QuickAddModal from './QuickAddModal';
import BulkUploadModal from './BulkUploadModal';

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
  const [tab, setTab] = useState<Tab>('items');
  const [items, setItems] = useState(initialItems);
  const [bundles, setBundles] = useState(initialBundles);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [creating, setCreating] = useState(false);
  const [previewItem, setPreviewItem] = useState<Item | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [quickAddCategory, setQuickAddCategory] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [, startTransition] = useTransition();

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
      alert(e.message);
    } finally {
      setBusyId(null);
    }
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
      alert(e.message);
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
              {/* Hızlı ekleme: aktif kategori varsa onun adıyla */}
              {categoryFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setQuickAddCategory(categoryFilter)}
                  className="px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                  <Zap className="w-4 h-4" /> Hızlı {getCategoryDef(categoryFilter).label} Ekle
                </button>
              )}
              <button
                type="button"
                onClick={() => setBulkOpen(true)}
                className="px-4 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 text-sm font-semibold flex items-center gap-2 transition-colors"
                title="JSON dosyası ile toplu yükle / mevcut kataloğu yedekle"
              >
                <Upload className="w-4 h-4" /> JSON Yükle
              </button>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="px-4 py-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 text-sm font-semibold flex items-center gap-2 transition-colors"
                title="Detaylı form (tüm alanlar)"
              >
                <Plus className="w-4 h-4" /> Detaylı Ekle
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

            {/* Hızlı ekle CTA paneli — boş kategoriler veya kullanıcı yönlendirme */}
            <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-3 flex-wrap">
              <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-sm text-slate-300">
                <strong className="text-emerald-300">Hızlı ekle:</strong> Kategori seç, sadece isim + renk + fiyat gir.
              </span>
              <div className="ml-auto flex items-center gap-1.5 flex-wrap">
                {CATEGORIES.filter(c => ['frames', 'gift', 'entry_effect', 'glow_message'].includes(c.slug)).map(c => (
                  <button
                    type="button"
                    key={c.slug}
                    onClick={() => setQuickAddCategory(c.slug)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 flex items-center gap-1.5 transition-colors"
                  >
                    <span>{c.emoji}</span>
                    + {c.label}
                  </button>
                ))}
              </div>
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
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0"
                    style={{
                      background: it.bg_gradient_start && it.bg_gradient_end
                        ? `linear-gradient(135deg, ${it.bg_gradient_start}, ${it.bg_gradient_end})`
                        : '#1e293b',
                    }}
                  >
                    {it.art_emoji || '📦'}
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
                    {(it.rarity || 'common').toUpperCase()}
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
                    onClick={() => {
                      if (!confirm(`"${it.name}" silinsin mi?`)) return;
                      callItemAction(it.id, { delete: true });
                    }}
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
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                            style={{
                              background: it.bg_gradient_start && it.bg_gradient_end
                                ? `linear-gradient(135deg, ${it.bg_gradient_start}, ${it.bg_gradient_end})`
                                : '#1e293b',
                            }}
                          >
                            {it.art_emoji || '📦'}
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
                          {(it.rarity || 'common').toUpperCase()}
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
                            title="Düzenle"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!confirm(`"${it.name}" silinsin mi? Geri alınamaz.`)) return;
                              callItemAction(it.id, { delete: true });
                            }}
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
                      {categoryFilter !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setQuickAddCategory(categoryFilter)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm font-bold hover:bg-emerald-500/25 transition-colors"
                        >
                          <Zap className="w-4 h-4" />
                          {getCategoryDef(categoryFilter).emoji} İlk {getCategoryDef(categoryFilter).label} ürününü ekle
                        </button>
                      )}
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

      {quickAddCategory && (
        <QuickAddModal
          category={quickAddCategory}
          onClose={() => setQuickAddCategory(null)}
          onCreated={(saved) => {
            setItems(prev => [saved, ...prev]);
            setCategoryFilter(quickAddCategory);
            setQuickAddCategory(null);
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

function ItemEditModal({
  item,
  onClose,
  onSaved,
}: {
  item: Item | null;
  onClose: () => void;
  onSaved: (saved: Item, isNew: boolean) => void;
}) {
  const isNew = !item;
  const [form, setForm] = useState<Partial<Item>>(
    item || {
      id: '',
      category: 'frame',
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

  const handleSave = async () => {
    if (!form.id || !form.name) {
      alert('ID ve isim gerekli');
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
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const update = (k: keyof Item, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-auto">
      <div className="bg-slate-900 border border-white/10 rounded-xl sm:rounded-2xl w-full max-w-2xl my-2 sm:my-8">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {isNew ? 'Yeni Ürün' : `Düzenle — ${item!.name}`}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl">✕</button>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Field label="ID (slug)" disabled={!isNew}>
            <input
              type="text"
              value={form.id || ''}
              onChange={e => update('id', e.target.value)}
              disabled={!isNew}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none disabled:opacity-50"
              placeholder="frame_aurora_001"
            />
          </Field>
          <Field label="İsim">
            <input
              type="text"
              value={form.name || ''}
              onChange={e => update('name', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none"
            />
          </Field>
          <Field label="Kategori">
            <select
              value={form.category || ''}
              onChange={e => update('category', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none"
            >
              {CATEGORIES.map(c => (
                <option key={c.slug} value={c.slug}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Nadirlik">
            <select
              value={form.rarity || ''}
              onChange={e => update('rarity', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none"
            >
              <option value="common">Common</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
              <option value="mythic">Mythic</option>
            </select>
          </Field>
          <Field label="Tagline" full>
            <input
              type="text"
              value={form.tagline || ''}
              onChange={e => update('tagline', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none"
            />
          </Field>
          <Field label="Emoji / İkon">
            <input
              type="text"
              value={form.art_emoji || ''}
              onChange={e => update('art_emoji', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none"
              maxLength={4}
            />
          </Field>
          <Field label="Fiyat (SP)">
            <input
              type="number"
              value={form.price_sp ?? 0}
              onChange={e => update('price_sp', parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none"
            />
          </Field>
          <Field label="Gradient Başlangıç">
            <input
              type="text"
              value={form.bg_gradient_start || ''}
              onChange={e => update('bg_gradient_start', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none font-mono text-xs"
              placeholder="#1e293b"
            />
          </Field>
          <Field label="Gradient Bitiş">
            <input
              type="text"
              value={form.bg_gradient_end || ''}
              onChange={e => update('bg_gradient_end', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none font-mono text-xs"
              placeholder="#0f172a"
            />
          </Field>
          <Field label="Sıra">
            <input
              type="number"
              value={form.display_order ?? 0}
              onChange={e => update('display_order', parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none"
            />
          </Field>
          <Field label="Koleksiyon ID">
            <input
              type="text"
              value={form.collection_id || ''}
              onChange={e => update('collection_id', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none"
            />
          </Field>
          <div className="col-span-2 flex items-center gap-5 pt-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!form.active} onChange={e => update('active', e.target.checked)} />
              Aktif
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!form.is_featured} onChange={e => update('is_featured', e.target.checked)} />
              Öne çıkan
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!form.per_message} onChange={e => update('per_message', e.target.checked)} />
              Her mesajda kullanılır
            </label>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-white/10 flex justify-end gap-2">
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
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-sm font-semibold hover:bg-amber-500/30 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Kaydet
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
