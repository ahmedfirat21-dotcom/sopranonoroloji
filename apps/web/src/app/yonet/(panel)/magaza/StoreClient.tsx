"use client";

import React, { useState, useTransition, useId, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Star, Smartphone, X, Upload, Sliders, FileJson, Image as ImageIcon } from 'lucide-react';
import { CATEGORIES, getCategoryDef, DB_CATEGORIES_EMOJI_SET } from './categories';
import MobilePreview from './MobilePreview';
import BulkUploadModal from './BulkUploadModal';
import { useAdminDialog } from '../../_components/AdminDialog';
// ★ P2-7: ItemLottiePreview import KALDIRILDI — CategoryCoverMini'deki kategori-özel mock'lar
//   silindi. MobilePreview kendi içinde lazy import edebilir gerekirse.

// İnce ayar editörleri — sadece tab açılınca yüklensin (kod-bölme, ilk açılış hızı için)
const FrameEditor = dynamic(() => import('../cerceveler/[id]/FrameEditor'), {
  ssr: false,
  loading: () => <div className="p-12 text-center text-slate-400 text-sm"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />İnce ayar paneli yükleniyor...</div>,
});
const EntryEffectEditor = dynamic(() => import('../giris-efektleri/[id]/EntryEffectEditor'), {
  ssr: false,
  loading: () => <div className="p-12 text-center text-slate-400 text-sm"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />İnce ayar paneli yükleniyor...</div>,
});

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
  editor_config?: any;       // ★ JSONB — frame_config / entry_config (ince ayar slider'ları)
  thumb_url?: string | null;   // ★ v119 — Mağaza listesi küçük resim (60×60)
  hero_url?: string | null;    // ★ v119 — Mağaza detay/banner (800×400)
  preview_url?: string | null; // ★ v119 — Picker/inline gösterim (160×160)
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
  // ★ P0-3: Bundle (paket) yönetimi
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [creatingBundle, setCreatingBundle] = useState(false);
  // ★ 2026-05-11: URL'den ?cat=frames gibi parametre okur — eski cerceveler/giris-efektleri
  //   sayfalarından redirect olunca filter otomatik açılır.
  const [categoryFilter, setCategoryFilter] = useState<string>(() => searchParams.get('cat') || 'all');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [, startTransition] = useTransition();

  // URL → state (sadece tarayıcı geri/ileri için). Aşağıdaki selectCategory
  // çift yön sync ettiği için tıklamada loop oluşmaz; ama yine de değer
  // gerçekten farklıysa (browser nav) güncellesin.
  useEffect(() => {
    const cat = searchParams.get('cat') || 'all';
    if (cat !== categoryFilter) setCategoryFilter(cat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Kategori chip tıklaması — state + URL birlikte güncellenir, böylece useEffect
  // bizi eski değere geri zorlamaz (önceki bug: chip tıklayınca filtre değişmiyordu).
  const selectCategory = (slug: string) => {
    setCategoryFilter(slug);
    const params = new URLSearchParams(searchParams.toString());
    if (slug === 'all') params.delete('cat');
    else params.set('cat', slug);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : '?', { scroll: false });
  };

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

  // ★ P0-3 (16 May 2026): Bundle silme
  const handleBundleDelete = async (bundle: Bundle) => {
    const ok = await dialog.confirm({
      title: `"${bundle.name}" silinecek`,
      message: 'Bu paket mağazadan kaldırılacak. İçindeki ürünler bağımsız kalmaya devam eder.',
      confirmLabel: 'Sil',
      danger: true,
    });
    if (!ok) return;
    setBusyId(bundle.id);
    try {
      const res = await fetch(`/yonet/api/store/bundles/${bundle.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delete: true }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Silinemedi');
      setBundles(prev => prev.filter(b => b.id !== bundle.id));
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
          {/* ★ P0-3 (16 May 2026): Paketler tab'ında "Yeni Paket" butonu eklendi —
                önce sadece toggle vardı, yeni paket oluşturmak için DB SQL gerekiyordu. */}
          {tab === 'bundles' && (
            <button
              type="button"
              onClick={() => setCreatingBundle(true)}
              className="px-5 py-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-200 hover:bg-amber-500/30 text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/10"
              title="Yeni paket oluştur (isim + fiyat + içerik)"
            >
              <Plus className="w-4 h-4" /> Yeni Paket
            </button>
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
                onClick={() => selectCategory('all')}
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
                  onClick={() => selectCategory(c.slug)}
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
              {/* ★ P0-1 (16 May 2026): gift kategorisi APK mağaza UI'da görünmüyor (oda içi
                   pay-per-send paneli kullanıyor). Admin "kayıp ürün" derdine düşmesin diye
                   bu kategoriye geçince info banner gösterilir. */}
              {unknown.map(slug => (
                <button
                  type="button"
                  key={slug}
                  onClick={() => selectCategory(slug)}
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

            {/* ★ P0-1 (16 May 2026): Kategori-spesifik bilgilendirme banner'ları —
                  admin "neden APK mağazada görünmüyor?" derdine düşmesin. */}
            {categoryFilter === 'gift' && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs">
                <span className="text-base shrink-0">ℹ️</span>
                <div className="text-amber-100/90 leading-relaxed">
                  <strong className="text-amber-200">Hediye ürünleri APK mağaza listesinde gözükmez.</strong>{' '}
                  Bunlar oda içi hediye panelinde (pay-per-send) kullanıcılara sunulur. Buradan eklediğin
                  fiyat ve görsel ürünün odada gönderilirken kullanılır.
                </div>
              </div>
            )}
            {categoryFilter === 'sp' && (
              <div className="mb-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-2.5 text-xs">
                <span className="text-base shrink-0">ℹ️</span>
                <div className="text-cyan-100/90 leading-relaxed">
                  <strong className="text-cyan-200">SP Paketleri burada yönetilir.</strong>{' '}
                  APK mağazasında "SP Paketleri" sekmesinde kart olarak listelenir, kullanıcı gerçek para ile
                  satın alır (Google Play / App Store IAP).
                </div>
              </div>
            )}

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
                  <CategoryCoverMini
                    category={it.category}
                    gradStart={it.bg_gradient_start || '#1e293b'}
                    gradEnd={it.bg_gradient_end || '#0f172a'}
                    thumbUrl={(it as any).thumb_url}
                    assetUrl={it.asset_url}
                    artEmoji={it.art_emoji}
                    formId={it.id}
                    size={48}
                    padding={(it.editor_config as any)?.cover?.padding ?? 0}
                    scale={(it.editor_config as any)?.cover?.scale ?? 1}
                    fit={(it.editor_config as any)?.cover?.fit ?? 'cover'}
                    position={(it.editor_config as any)?.cover?.position ?? 'center'}
                  />
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
                    title="Düzenle"
                    aria-label="Düzenle"
                    className="px-1 py-1.5 rounded-md text-[10px] font-semibold border bg-cyan-500/10 border-cyan-500/30 text-cyan-300 flex items-center justify-center"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmAndDelete(it)}
                    disabled={isBusy}
                    title="Sil"
                    aria-label="Sil"
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
                          <CategoryCoverMini
                            category={it.category}
                            gradStart={it.bg_gradient_start || '#1e293b'}
                            gradEnd={it.bg_gradient_end || '#0f172a'}
                            thumbUrl={(it as any).thumb_url}
                            assetUrl={it.asset_url}
                            artEmoji={it.art_emoji}
                            formId={it.id}
                            size={36}
                            padding={(it.editor_config as any)?.cover?.padding ?? 0}
                            scale={(it.editor_config as any)?.cover?.scale ?? 1}
                            fit={(it.editor_config as any)?.cover?.fit ?? 'cover'}
                            position={(it.editor_config as any)?.cover?.position ?? 'center'}
                          />
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
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => callBundleToggle(b.id, !b.active)}
                        disabled={busyId === b.id}
                        className="px-2 py-1.5 rounded-md text-[10px] font-semibold border bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 transition-colors flex items-center gap-1"
                        title={b.active ? 'Pasifleştir' : 'Aktifleştir'}
                      >
                        {busyId === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (b.active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />)}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingBundle(b)}
                        disabled={busyId === b.id}
                        className="px-2 py-1.5 rounded-md text-[10px] font-semibold border bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                        title="Düzenle"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBundleDelete(b)}
                        disabled={busyId === b.id}
                        className="px-2 py-1.5 rounded-md text-[10px] font-semibold border bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20 transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {bundles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm">
                    <div className="text-slate-500 mb-3">Henüz paket yok.</div>
                    <button
                      type="button"
                      onClick={() => setCreatingBundle(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-200 text-sm font-bold hover:bg-amber-500/30 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> İlk paketi oluştur
                    </button>
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

      {/* ★ P0-3: Bundle oluştur/düzenle modal */}
      {(editingBundle || creatingBundle) && (
        <BundleEditModal
          bundle={editingBundle}
          allItems={items}
          onClose={() => { setEditingBundle(null); setCreatingBundle(false); }}
          onSaved={(saved, isNew) => {
            if (isNew) setBundles(prev => [...prev, saved]);
            else setBundles(prev => prev.map(b => b.id === saved.id ? saved : b));
            setEditingBundle(null);
            setCreatingBundle(false);
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
const ASSET_FORMAT_HINTS: Record<string, { recommended: string; tip: string; needsAsset?: boolean; needsCover?: boolean; assetNote?: string }> = {
  frames:        { recommended: 'PNG (şeffaf zemin, kare) veya Lottie JSON',     tip: '512×512 px önerilir', needsAsset: true,  needsCover: true },
  entry_effect:  { recommended: 'Lottie JSON (animasyonlu)',                      tip: 'Veya GIF/WebP fallback', needsAsset: true,  needsCover: true },
  gift:          { recommended: 'Lottie JSON veya PNG',                           tip: 'Sohbete gönderildiğinde oynayacak', needsAsset: true,  needsCover: true },
  background:    { recommended: 'PNG/JPG arkaplan',                               tip: 'Profil/oda arkaplanı', needsAsset: true,  needsCover: true },
  effect:        { recommended: 'Lottie JSON',                                    tip: 'Genel görsel efekt', needsAsset: true,  needsCover: true },
  emoji:         { recommended: 'PNG (şeffaf zemin)',                             tip: '128×128 önerilir', needsAsset: false, needsCover: true,
                   assetNote: 'Emoji setindeki tek tek emojiler "İnce Ayar > Liste" sekmesinden eklenir.' },
  badge:         { recommended: 'PNG/SVG (şeffaf zemin)',                         tip: '128×128 rozet ikonu', needsAsset: false, needsCover: true,
                   assetNote: 'Rozet şekli/renk/ikonu "İnce Ayar" sayfasından seçilir. Özel görsel istersen yüklenebilir.' },
  glow_message:  { recommended: '—',                                              tip: '', needsAsset: false, needsCover: true,
                   assetNote: 'Parlak mesaj sadece config (renk/glow/animasyon). Dosya yüklemeye gerek yok — "İnce Ayar"dan düzenle.' },
  theme:         { recommended: '—',                                              tip: '', needsAsset: false, needsCover: true,
                   assetNote: 'Tema sadece renk paleti. Dosya yüklemeye gerek yok — "İnce Ayar" sayfasından renkleri düzenle.' },
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
  const router = useRouter();
  const isNew = !item;
  // ★ P3-9 (16 May 2026): art_emoji artık kategoriye göre default — getCategoryDef ile.
  //   Önce hardcode '✨' idi; rozet için 🏅, gift için 🎁 vs. olması gerekir. categories.ts'ten okur.
  const initialCategory = defaultCategory || 'frames';
  const [form, setForm] = useState<Partial<Item>>(
    item || {
      id: '',
      category: initialCategory,
      rarity: 'common',
      name: '',
      tagline: '',
      art_emoji: getCategoryDef(initialCategory).emoji,
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

  // ★ P3-9: Kategori değişince art_emoji'yi kategori default'una otomatik güncelle —
  //   AMA sadece kullanıcı emoji'yi manuel değiştirmediyse (önceki kategori default'unda kalmışsa).
  //   Bu sayede yeni Plus rozetinde 🏅, bg'de 🌌 otomatik gelir; admin emoji yazdıysa korunur.
  useEffect(() => {
    if (!isNew) return;
    setForm(prev => {
      const currentCat = prev.category;
      if (!currentCat) return prev;
      // Mevcut emoji başka bir kategori default'una eşit mi → o zaman değiştirmeye izin var
      const isLeftoverDefault = DB_CATEGORIES_EMOJI_SET.has(prev.art_emoji || '');
      if (!isLeftoverDefault && prev.art_emoji) return prev; // admin manuel girdiyse koru
      return { ...prev, art_emoji: getCategoryDef(currentCat).emoji };
    });
  }, [form.category, isNew]);

  // ID stamp'i modal açıldığında bir kez üretilir — her tuşa basışta değişmesin.
  // (Bug'dı: her render Date.now() yeni → ID sürekli yenileniyordu.)
  const idStampRef = useRef(Date.now().toString(36).slice(-4));

  // Yeni ürün için ID otomatik üret — isim + kategori + sabit stamp
  useEffect(() => {
    if (!isNew) return;
    if (!form.name) return;
    const slug = form.name
      .toLowerCase()
      .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30);
    if (!slug) return;
    const newId = `${form.category}_${slug}_${idStampRef.current}`;
    setForm(prev => prev.id === newId ? prev : { ...prev, id: newId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name, form.category]);

  // ★ v119: 4 slot upload akışı — asset (Lottie/ana), thumb (60×60), hero (800×400), preview (160×160)
  type MediaSlot = 'asset' | 'thumb' | 'hero' | 'preview';
  const SLOT_COLUMN: Record<MediaSlot, 'asset_url' | 'thumb_url' | 'hero_url' | 'preview_url'> = {
    asset: 'asset_url', thumb: 'thumb_url', hero: 'hero_url', preview: 'preview_url',
  };
  const fileInputRefs: Record<MediaSlot, React.MutableRefObject<HTMLInputElement | null>> = {
    asset: useRef<HTMLInputElement | null>(null),
    thumb: useRef<HTMLInputElement | null>(null),
    hero: useRef<HTMLInputElement | null>(null),
    preview: useRef<HTMLInputElement | null>(null),
  };
  // Geriye dönük uyumluluk — eski tek-slot UI parçaları için fileInputRef alias
  const fileInputRef = fileInputRefs.asset;
  const [uploadingSlot, setUploadingSlot] = useState<MediaSlot | null>(null);
  const uploading = uploadingSlot === 'asset'; // eski UI parçaları için
  const [uploadedType, setUploadedType] = useState<'lottie' | 'image' | null>(
    item?.asset_url ? (/\.json($|\?)/i.test(item.asset_url) ? 'lottie' : 'image') : null
  );

  const formatHint = ASSET_FORMAT_HINTS[form.category || ''] ?? {
    recommended: 'PNG, Lottie JSON, SVG, GIF veya WebP',
    tip: 'Maks 10 MB',
    needsAsset: true,
    needsCover: true,
  };
  const needsAsset = formatHint.needsAsset !== false;
  const needsCover = formatHint.needsCover !== false;

  const handleFileUpload = async (file: File, slot: MediaSlot = 'asset') => {
    if (file.size > 10 * 1024 * 1024) {
      await dialog.alert({ title: 'Dosya çok büyük', message: 'Maks 10 MB olabilir.', variant: 'error' });
      return;
    }
    // Thumbnail/Hero/Preview yalnızca image
    const isImageOnlySlot = slot !== 'asset';
    const allowed = isImageOnlySlot
      ? ['image/png', 'image/jpeg', 'image/svg+xml', 'image/gif', 'image/webp']
      : ['application/json', 'image/png', 'image/jpeg', 'image/svg+xml', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      await dialog.alert({
        title: 'Geçersiz tip',
        message: isImageOnlySlot
          ? `${file.type} kabul edilmiyor. Sadece PNG, JPG, SVG, GIF veya WebP olabilir.`
          : `${file.type} kabul edilmiyor. JSON (Lottie), PNG, JPG, SVG, GIF veya WebP olabilir.`,
        variant: 'error',
      });
      return;
    }

    setUploadingSlot(slot);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', form.category || 'other');
      fd.append('slot', slot);
      const res = await fetch('/yonet/api/store/upload-asset', { method: 'POST', body: fd });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || 'Yükleme başarısız');

      const col = SLOT_COLUMN[slot];
      setForm(prev => ({ ...prev, [col]: j.url }));
      if (slot === 'asset') setUploadedType(j.asset_type);
    } catch (e: any) {
      await dialog.alert({ title: 'Yükleme hatası', message: e.message, variant: 'error' });
    } finally {
      setUploadingSlot(null);
      const r = fileInputRefs[slot].current;
      if (r) r.value = '';
    }
  };

  const handleClearSlot = (slot: MediaSlot) => {
    const col = SLOT_COLUMN[slot];
    setForm(prev => ({ ...prev, [col]: null }));
    if (slot === 'asset') setUploadedType(null);
  };
  // Eski tek-slot çağrıları için alias
  const handleClearAsset = () => handleClearSlot('asset');

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

  // İnce ayar paneli — frame ve entry effect için modal-içi tab.
  // (Eski: /yonet/cerceveler/[id] sayfasına yönlendirme yapıyordu — tek modaldan
  //  ayrılmamak için artık FrameEditor/EntryEffectEditor doğrudan tab içinde embed.)
  const fineEditorType: 'frame' | 'entry' | 'glow' | 'badge' | 'background' | 'theme' | 'emoji' | 'effect' | null =
    form.category === 'frames' || form.category === 'atelier' ? 'frame'
      : form.category === 'entry_effect' ? 'entry'
      : form.category === 'glow_message' ? 'glow'
      : form.category === 'badge' ? 'badge'
      : form.category === 'background' ? 'background'
      : form.category === 'theme' ? 'theme'
      : form.category === 'emoji' ? 'emoji'
      : form.category === 'effect' ? 'effect'
      : null;
  const showFineTab = !isNew && !!fineEditorType;
  const [activeTab, setActiveTab] = useState<'general' | 'fine'>('general');
  // ★ F-2 (16 May 2026): Form içinde 3 alt-tab — Temel / Görsel / Ayarlar.
  //   ItemEditModal devasa form → kullanıcı 800+ satır scroll ediyordu. Section'lar tab'lara
  //   dağıtıldı, mevcut form düzeni KORUNDU (sadece koşullu render). Risk düşük.
  const [formSection, setFormSection] = useState<'basic' | 'visual' | 'settings'>('basic');
  // Yeni ürüne dönülünce veya kategori değişince tab'ı sıfırla
  useEffect(() => {
    if (!showFineTab && activeTab === 'fine') setActiveTab('general');
  }, [showFineTab, activeTab]);

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
      <div className={`bg-slate-900 border border-white/10 rounded-xl sm:rounded-2xl w-full my-2 sm:my-8 ${activeTab === 'fine' ? 'max-w-7xl' : 'max-w-5xl'}`}>
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
              {activeTab === 'general'
                ? 'Kategori seç · dosya yükle · ayarları gir · sağda canlı önizle'
                : 'Slider\'larla ölçek/glow/renk filtresi/animasyon — değişiklikler ayrı kaydedilir'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl w-8 h-8 flex items-center justify-center" aria-label="Kapat">✕</button>
        </div>

        {/* ★ v1.3.54: Tab bar kaldırıldı — Genel tab tek seçenek (İnce Ayar artık
             ayrı sayfaya yönlendiren bir CTA, tab değil). Alt kısımda "İnce Ayar
             Sayfasına Geç" butonu var, çift gösterim gereksizdi. */}

        {/* ★ v1.3.54: İnce Ayar artık modal içinde değil — ayrı sayfaya yönlendiriyor.
             /yonet/cerceveler/[id] veya /yonet/giris-efektleri/[id]. Modal içinde çift
             scroll container "yukarıya zıplama" bug yaratıyordu. Ayrı sayfa daha sade UX. */}

        {/* Gövde — sol form, sağ önizleme (sadece Genel tab'ında) */}
        {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-0">
          {/* SOL — form */}
          <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* ★ F-2 (16 May 2026): Form tab navigator — Temel / Görsel / Ayarlar */}
            <div className="flex items-center gap-1.5 sticky -top-5 -mt-5 -mx-5 px-5 py-2.5 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 z-10">
              {([
                { k: 'basic',    l: 'Temel',  i: '📝' },
                { k: 'visual',   l: 'Görsel', i: '🎨' },
                { k: 'settings', l: 'Ayarlar', i: '⚙️' },
              ] as const).map(t => (
                <button
                  key={t.k}
                  type="button"
                  onClick={() => setFormSection(t.k)}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 ${
                    formSection === t.k
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <span>{t.i}</span> {t.l}
                </button>
              ))}
            </div>

            {/* ★ F-2: TAB=basic — Kategori bölümü */}
            {formSection === 'basic' && (
            <>
            {/* 1) Kategori — yeni ürün ise chip seçici, mevcut ürün ise readonly badge */}
            {isNew ? (
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                          active
                            ? 'bg-amber-500/25 border-amber-500/60 text-amber-200'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                        title={c.description}
                      >
                        <span>{c.emoji}</span> {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="opacity-70">Kategori:</span>
                {(() => {
                  const c = CATEGORIES.find(x => x.slug === form.category);
                  return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-200 font-semibold">
                      <span>{c?.emoji || '📦'}</span> {c?.label || form.category}
                    </span>
                  );
                })()}
              </div>
            )}
            </>
            )}

            {/* ★ F-2: TAB=visual — Asset upload + Cover ayarları */}
            {formSection === 'visual' && (
            <>
            {/* 2) Asset upload — kategoriye özel format ipucu (sadece needsAsset olan kategoriler için) */}
            {!needsAsset ? (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3.5 flex items-start gap-2.5">
                <div className="text-xl shrink-0">💡</div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-cyan-200">Bu kategori için dosya yüklemeye gerek yok</div>
                  <div className="text-[11px] text-cyan-300/80 mt-1 leading-relaxed">
                    {(formatHint as any).assetNote || 'Ayarlar İnce Ayar sayfasından yapılır.'}
                  </div>
                </div>
              </div>
            ) : (
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-amber-300 mb-2 flex items-center justify-between">
                <span>2. ANA DOSYA <span className="text-slate-500 font-normal text-[9px] ml-1">(animasyon / asset)</span></span>
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
            )}

            {/* ★ v119: 2b — Mağaza Ön Kapak Görseli (tek slot + boyutlandırma seçenekleri) */}
            {needsCover && (
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-amber-300 mb-2">
                2b. MAĞAZA ÖN KAPAK GÖRSELİ <span className="text-slate-500 font-normal text-[9px] ml-1">(opsiyonel — boş bırakırsan kategori varsayılanı gösterilir)</span>
              </label>
              {(() => {
                const url = form.thumb_url as string | null | undefined;
                const isUploading = uploadingSlot === 'thumb';
                const inputRef = fileInputRefs.thumb;
                // Boyutlandırma alanları editor_config.cover_fit içinde tutulur — opsiyonel
                const cov = (form.editor_config?.cover || {}) as { fit?: string; scale?: number; padding?: number; position?: string };
                const fit = cov.fit || 'cover';
                const scale = cov.scale ?? 1;
                const padding = cov.padding ?? 0;
                const position = cov.position || 'center';
                const setCov = (patch: Partial<typeof cov>) => setForm(prev => ({
                  ...prev,
                  editor_config: { ...(prev.editor_config || {}), cover: { ...(prev.editor_config?.cover || {}), ...patch } },
                }));
                const gradStart = form.bg_gradient_start || '#1e293b';
                const gradEnd = form.bg_gradient_end || '#0f172a';
                const rarityLabelMap: Record<string, string> = {
                  common: 'NORMAL', uncommon: 'NADİR', rare: 'EFSANE', epic: 'EPIK', legendary: 'EFSANEVİ',
                };
                return (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-3">
                    <div className="flex items-start gap-3">
                      {/* MAĞAZA ÜRÜN KARTI ÖNİZLEMESİ — gerçek listedeki kartın birebir aynısı */}
                      <div className="shrink-0 space-y-1.5">
                        <div className="text-[9px] text-amber-300/80 font-bold tracking-wider uppercase">
                          Ürün Kartı Önizleme
                        </div>
                        <div className="rounded-xl border bg-white/5 p-3 relative" style={{ width: 200, borderColor: `${gradStart}40` }}>
                          {/* Üst satır: kapak + ad + kategori + aktif badge */}
                          <div className="flex items-center gap-2 mb-2">
                            <CategoryCoverMini
                              category={form.category || ''}
                              gradStart={gradStart}
                              gradEnd={gradEnd}
                              padding={padding}
                              scale={scale}
                              fit={fit}
                              position={position}
                              thumbUrl={url}
                              assetUrl={form.asset_url}
                              artEmoji={form.art_emoji}
                              formId={form.id}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-xs text-slate-100 truncate">
                                {form.name || 'Ürün adı'}
                              </div>
                              <div className="text-[9px] text-slate-400">
                                {(() => {
                                  const c = CATEGORIES.find(x => x.slug === form.category);
                                  return c ? `${c.emoji} ${c.label}` : '📦 Diğer';
                                })()}
                              </div>
                            </div>
                            {form.active ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[8px] font-bold">AKTİF</span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400 text-[8px] font-bold">PASİF</span>
                            )}
                          </div>
                          {/* Alt satır: rarity + fiyat */}
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              {rarityLabelMap[form.rarity || 'common'] || 'NORMAL'}
                            </span>
                            <span className="text-amber-400 font-bold">
                              ★ {(form.price_sp ?? 0).toLocaleString('tr-TR')} SP
                            </span>
                          </div>
                          {/* Upload/clear butonları sağ üst köşe */}
                          <div className="absolute -top-1 -right-1 flex gap-1">
                            <button type="button" onClick={() => inputRef.current?.click()}
                              className="w-6 h-6 rounded-md bg-cyan-500/90 text-white flex items-center justify-center hover:bg-cyan-500 shadow-md"
                              title="Görsel yükle / değiştir" disabled={isUploading}>
                              {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                            </button>
                            {url && (
                              <button type="button" onClick={() => handleClearSlot('thumb')}
                                className="w-6 h-6 rounded-md bg-red-500/90 text-white flex items-center justify-center hover:bg-red-500 shadow-md"
                                title="Görseli kaldır">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-[9px] text-slate-500 leading-tight">
                          ↑ Mağaza listesinde böyle görünür
                        </div>
                      </div>

                      {/* Boyutlandırma seçenekleri */}
                      <div className="flex-1 space-y-2">
                        <div>
                          <div className="text-[10px] text-slate-400 mb-1">Sığdırma</div>
                          <select value={fit} onChange={e => setCov({ fit: e.target.value })}
                            title="Görsel sığdırma modu" aria-label="Sığdırma modu"
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200">
                            <option value="cover">Cover (kırp + doldur)</option>
                            <option value="contain">Contain (sığdır)</option>
                            <option value="fill">Fill (bozarak doldur)</option>
                            <option value="none">None (orijinal)</option>
                          </select>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 mb-1">Konum</div>
                          <select value={position} onChange={e => setCov({ position: e.target.value })}
                            title="Görsel konum hizalama" aria-label="Konum"
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200">
                            <option value="center">Merkez</option>
                            <option value="top">Üst</option>
                            <option value="bottom">Alt</option>
                            <option value="left">Sol</option>
                            <option value="right">Sağ</option>
                            <option value="top left">Sol Üst</option>
                            <option value="top right">Sağ Üst</option>
                            <option value="bottom left">Sol Alt</option>
                            <option value="bottom right">Sağ Alt</option>
                          </select>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span>Ölçek</span>
                            <span className="text-slate-200 font-mono">{scale.toFixed(2)}x</span>
                          </div>
                          <input type="range" min={0.5} max={1.5} step={0.05} value={scale}
                            onChange={e => setCov({ scale: parseFloat(e.target.value) })}
                            title="Görsel ölçek (0.5x — 1.5x)" aria-label="Ölçek"
                            className="w-full accent-cyan-500" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span>İç Boşluk (Padding)</span>
                            <span className="text-slate-200 font-mono">{padding}px</span>
                          </div>
                          <input type="range" min={0} max={20} step={1} value={padding}
                            onChange={e => setCov({ padding: parseFloat(e.target.value) })}
                            title="Görsel iç boşluğu (px)" aria-label="Padding"
                            className="w-full accent-cyan-500" />
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 leading-relaxed">
                      💡 Bu görsel mağaza listesinde / ürün kartında ön kapak olarak gösterilir. Boyutlandırma ayarları görsel kırpılma şeklini belirler.
                    </div>
                    <input ref={inputRef} type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                      aria-label="Mağaza ön kapak görseli"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'thumb');
                      }}
                      className="hidden" />
                  </div>
                );
              })()}
            </div>
            )}

            </>
            )}

            {/* ★ F-2: TAB=basic — Temel bilgiler (isim/tagline/fiyat/rarity) */}
            {formSection === 'basic' && (
            <>
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
                    min={0}
                    step={50}
                    value={form.price_sp ?? 0}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10);
                      update('price_sp', Number.isFinite(v) && v >= 0 ? v : 0);
                    }}
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

            </>
            )}

            {/* ★ F-2: TAB=visual — Renk / Gradient */}
            {formSection === 'visual' && (
            <>
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

            </>
            )}

            {/* ★ F-2: TAB=settings — Durum + Toggle'lar */}
            {formSection === 'settings' && (
            <>
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

            {/* ★ v1.3.54: İnce Ayar — ayrı sayfaya yönlendirir (modal değil). */}
            {showFineTab && item && (
              <button
                type="button"
                onClick={() => {
                  const routeMap: Record<string, string> = {
                    frame: 'cerceveler', entry: 'giris-efektleri', glow: 'parlak-mesajlar',
                    badge: 'rozetler', background: 'arkaplanlar', theme: 'temalar',
                    emoji: 'emojiler', effect: 'efektler',
                  };
                  const seg = fineEditorType ? routeMap[fineEditorType] : null;
                  if (seg) router.push(`/yonet/${seg}/${item.id}`);
                }}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-500/20 text-sm font-semibold transition-colors"
                title="Slider'lı detaylı yapılandırma — ayrı sayfada açılır"
              >
                <Sliders className="w-4 h-4" />
                <div className="flex-1 text-left">
                  <div>İnce Ayar Sayfasına Geç</div>
                  <div className="text-[10px] text-fuchsia-400/70 font-normal">
                    {fineEditorType === 'entry' ? 'Avatar pozisyonu, animasyon, partikül, sahne efekti'
                      : fineEditorType === 'glow' ? 'Bubble glow, animasyon, sınır, yazı stili'
                      : fineEditorType === 'badge' ? 'Şekil, ikon, glow, animasyon, konum'
                      : fineEditorType === 'background' ? 'Görsel, gradient, blur, parallax'
                      : fineEditorType === 'theme' ? 'Renk palet, gradient, dark/light'
                      : fineEditorType === 'emoji' ? 'Set yönetimi, animasyon, sıralama'
                      : fineEditorType === 'effect' ? 'Partikül, overlay, sahne efekti'
                      : 'Boyut bazlı + tüm slider/toggle/renk ayarları'}
                  </div>
                </div>
                <span className="text-lg">→</span>
              </button>
            )}
            </>
            )}
            {/* ★ F-2: 3 tab kapanışı (basic/visual/settings) */}
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
        )}

        {/* Aksiyon — Genel tab: İptal/Kaydet · İnce Ayar tab: Kapat
            (FrameEditor/EntryEffectEditor kendi 'Kaydet' butonunu içerir, çift kaydetme olmaz) */}
        <div className="px-5 py-4 border-t border-white/10 flex justify-between items-center gap-2 sticky bottom-0 bg-slate-900 rounded-b-2xl">
          <div className="text-[10px] text-slate-500">
            {activeTab === 'fine' && '↑ Ayarları yukarıdaki Kaydet butonuyla işle. Mobilde 5 dk içinde uygulanır.'}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10"
            >
              {activeTab === 'fine' ? 'Kapat' : 'İptal'}
            </button>
            {activeTab === 'general' && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !form.name}
                className="px-5 py-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-200 text-sm font-bold hover:bg-amber-500/30 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isNew ? 'Mağazaya Ekle' : 'Kaydet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * CategoryCoverMini — Mağaza ürün kartı kapak alanı (48px civarı thumbnail)
 * Kategori-bazlı mock + ürün asset'i overlay. Hem modal önizlemede hem mağaza
 * listesinde kullanılır.
 *
 * Öncelik: thumb_url (manuel kapak) → kategori mock + asset overlay → emoji fallback
 */
function CategoryCoverMini({ category, gradStart, gradEnd, padding = 0, scale = 1, fit = 'cover', position = 'center',
  thumbUrl, assetUrl, artEmoji, formId, size = 48,
}: {
  category: string; gradStart: string; gradEnd: string;
  padding?: number; scale?: number; fit?: string; position?: string;
  thumbUrl?: string | null; assetUrl?: string | null; artEmoji?: string | null;
  formId?: string; size?: number;
}) {
  // ★ P2-7 (16 May 2026): SADE FALLBACK — eskiden kategoriye özel mock'lar (Lottie animation +
  //   complex grid'ler) vardı. Liste performansı düşüyordu + bazı kategori Lottie, bazısı
  //   emoji gösteriyordu → karman çorman görünüm. Şimdi:
  //   1) thumb_url varsa onu göster (admin yüklediyse)
  //   2) yoksa kategori gradient + art_emoji (veya kategori default emoji)
  //   Detay/preview için zaten ayrı yerlerde Lottie render var.

  // Manuel ön kapak yüklenmişse onu göster (en yüksek öncelik)
  if (thumbUrl) {
    return (
      <div className="rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative"
        style={{ width: size, height: size, background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})`, padding }}>
        <img src={thumbUrl} alt="Kapak" style={{
          width: '100%', height: '100%',
          objectFit: fit as any, objectPosition: position,
          transform: `scale(${scale})`, transformOrigin: 'center',
        }} />
      </div>
    );
  }

  // Sade fallback — gradient zemin + kategori/ürün emoji
  const catDef = getCategoryDef(category);
  const displayEmoji = artEmoji || catDef.emoji;
  const innerSize = size - padding * 2;
  return (
    <div className="rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})`, padding }}>
      <span style={{
        fontSize: innerSize * 0.55,
        transform: `scale(${scale})`,
        lineHeight: 1,
      }}>
        {displayEmoji}
      </span>
    </div>
  );
}

// ★ P2-7 (16 May 2026): ESKİ kategori-özel mock fallback'lar (her kategori için ayrı
//   ItemLottiePreview + complex grid layout) tamamen kaldırıldı. Performans yüksekti
//   (her kart Lottie spawn ediyordu) + bazı kategori Lottie, bazısı statik View → liste
//   karman çorman görünüyordu. Şimdi tek sade fallback: gradient + emoji (yukarıda).
//   Detay/preview için ayrı yerlerde Lottie render var (MobilePreview, item detail).

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

/* ═══════════════════════════════════════════════════════════════════
   ★ P0-3 (16 May 2026): BundleEditModal — cosmetic_bundles + bundle_items
   ─────────────────────────────────────────────────────────────────────
   Önce yoktu: paket toggle vardı ama oluşturma/düzenleme/silme yoktu,
   içerik (paket ürünleri) DB'den SQL ile yönetiliyordu. Şimdi tam UI.
   ═══════════════════════════════════════════════════════════════════ */
function BundleEditModal({
  bundle,
  allItems,
  onClose,
  onSaved,
}: {
  bundle: Bundle | null;
  allItems: Item[];
  onClose: () => void;
  onSaved: (saved: Bundle, isNew: boolean) => void;
}) {
  const dialog = useAdminDialog();
  const isNew = !bundle;
  const [form, setForm] = useState<Partial<Bundle>>(
    bundle || {
      id: '',
      name: '',
      tagline: '',
      art_emoji: '🎁',
      rarity: 'common',
      total_price_sp: 500,
      discount_pct: 10,
      sort_order: 0,
      active: true,
    },
  );
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [loadingItems, setLoadingItems] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // Düzenleme modunda mevcut paket içeriğini çek
  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/yonet/api/store/bundles/${encodeURIComponent(bundle!.id)}`);
        const j = await res.json();
        if (!cancelled && Array.isArray(j.item_ids)) setItemIds(j.item_ids);
      } catch {
        /* sessiz geç */
      } finally {
        if (!cancelled) setLoadingItems(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundle?.id]);

  // Sadece aktif kozmetik ürünler bundle'a eklenebilir (sp_packages, gift gibi şeyler değil)
  const availableItems = allItems.filter(i => i.active);

  const totalSPFromItems = itemIds
    .map(id => availableItems.find(i => i.id === id)?.price_sp ?? 0)
    .reduce((s, p) => s + p, 0);

  const toggleItem = (itemId: string) => {
    setItemIds(prev => prev.includes(itemId) ? prev.filter(i => i !== itemId) : [...prev, itemId]);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      await dialog.alert({ title: 'Geçersiz', message: 'Paket adı boş olamaz.', variant: 'error' });
      return;
    }
    if (itemIds.length === 0) {
      const ok = await dialog.confirm({
        title: 'Paket boş',
        message: 'Bu paket içinde hiç ürün yok. Yine de kaydedilsin mi?',
        confirmLabel: 'Yine de kaydet',
      });
      if (!ok) return;
    }

    setSaving(true);
    try {
      let savedBundle: Bundle;
      if (isNew) {
        const res = await fetch('/yonet/api/store/bundles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ create: form, item_ids: itemIds }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Oluşturulamadı');
        savedBundle = j.bundle;
      } else {
        const res = await fetch(`/yonet/api/store/bundles/${encodeURIComponent(bundle!.id)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ update: form }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Güncellenemedi');
        // Ardından içerik sync
        await fetch(`/yonet/api/store/bundles/${encodeURIComponent(bundle!.id)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ set_items: itemIds }),
        });
        savedBundle = j.bundle;
      }
      onSaved(savedBundle, isNew);
    } catch (e: any) {
      await dialog.alert({ title: 'Hata', message: e.message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">{isNew ? 'Yeni Paket' : 'Paket Düzenle'}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${step === 1 ? 'bg-amber-500/20 text-amber-200' : 'text-slate-500'}`}
              >
                1. Temel Bilgi
              </button>
              <span className="text-slate-600">→</span>
              <button
                type="button"
                onClick={() => setStep(2)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${step === 2 ? 'bg-amber-500/20 text-amber-200' : 'text-slate-500'}`}
              >
                2. İçindeki Ürünler ({itemIds.length})
              </button>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === 1 && (
            <>
              <div className="grid grid-cols-[80px_1fr] gap-3">
                <div className="flex flex-col items-center">
                  <input
                    type="text"
                    maxLength={3}
                    value={form.art_emoji || ''}
                    onChange={e => setForm(p => ({ ...p, art_emoji: e.target.value }))}
                    className="w-20 h-20 rounded-2xl bg-black/30 border border-white/10 text-4xl text-center"
                  />
                  <div className="text-[9px] text-slate-500 mt-1">EMOJİ</div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Paket Adı</label>
                    <input
                      type="text"
                      value={form.name || ''}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="örn. Başlangıç Seti"
                      className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Açıklama (kısa)</label>
                    <input
                      type="text"
                      value={form.tagline || ''}
                      onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))}
                      placeholder="örn. Yeni başlayanlar için indirimli set"
                      className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fiyat (SP)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.total_price_sp ?? 0}
                    onChange={e => setForm(p => ({ ...p, total_price_sp: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-amber-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">İndirim %</label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={form.discount_pct ?? 0}
                    onChange={e => setForm(p => ({ ...p, discount_pct: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-cyan-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sıralama</label>
                  <input
                    type="number"
                    value={form.sort_order ?? 0}
                    onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-slate-100 font-mono"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 px-3 py-2 rounded-lg bg-black/20 border border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active !== false}
                  onChange={e => setForm(p => ({ ...p, active: e.target.checked }))}
                />
                Aktif (mağazada gözüksün)
              </label>

              {/* İçerik SP karşılaştırma */}
              {itemIds.length > 0 && (
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-xs">
                  <div className="text-cyan-100/90">
                    İçindeki ürünlerin toplam SP değeri: <strong className="text-cyan-200 font-mono">{totalSPFromItems.toLocaleString('tr-TR')}</strong>
                  </div>
                  {(form.total_price_sp ?? 0) < totalSPFromItems && (
                    <div className="text-emerald-300 mt-1">
                      Paket fiyatı %{Math.round((1 - (form.total_price_sp ?? 0) / totalSPFromItems) * 100)} daha ucuz — kullanıcı için cazip
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full px-4 py-2.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-200 text-sm font-bold hover:bg-amber-500/30 transition-colors"
              >
                Devam → İçindeki Ürünleri Seç ({itemIds.length})
              </button>
            </>
          )}

          {step === 2 && (
            <>
              {loadingItems ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                </div>
              ) : (
                <>
                  <div className="text-xs text-slate-400 mb-2">
                    Pakete dahil edilecek ürünleri seç. Aktif kozmetik ürünleri listelenir.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
                    {availableItems.map(it => {
                      const checked = itemIds.includes(it.id);
                      const catDef = getCategoryDef(it.category);
                      return (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => toggleItem(it.id)}
                          className={`text-left px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                            checked
                              ? 'bg-amber-500/15 border-amber-500/50'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${it.bg_gradient_start || '#1e293b'}, ${it.bg_gradient_end || '#0f172a'})`,
                            }}
                          >
                            {it.art_emoji || catDef.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-100 truncate">{it.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {catDef.label} · {it.price_sp.toLocaleString('tr-TR')} SP
                            </div>
                          </div>
                          {checked && (
                            <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                              <span className="text-amber-950 text-[10px] font-bold">✓</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                    {availableItems.length === 0 && (
                      <div className="col-span-full text-center py-8 text-slate-500 text-sm">
                        Aktif kozmetik ürün yok. Önce "Ürünler" tab'ından ekle.
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 bg-black/20 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setStep(s => s === 2 ? 1 : 1)}
            disabled={step === 1}
            className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-30"
          >
            ← Geri
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-white/10"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-200 hover:bg-amber-500/30 text-sm font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isNew ? 'Paketi Oluştur' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
