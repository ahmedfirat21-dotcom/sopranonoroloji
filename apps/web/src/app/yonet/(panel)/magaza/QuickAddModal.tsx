"use client";

/**
 * QuickAddModal — Kategoriye özel basitleştirilmiş ürün ekleme.
 * Sadece o kategorinin gerekli alanları görünür, ID otomatik üretilir.
 * Inline mobil önizleme ile canlı görsel kontrol.
 */
import { useMemo, useRef, useState } from 'react';
import { Loader2, Check, ChevronDown, Sparkles, Upload, FileJson, Image as ImageIcon, X } from 'lucide-react';
import { CATEGORIES, getCategoryDef } from './categories';
import MobilePreview from './MobilePreview';
import { useAdminDialog } from '../../_components/AdminDialog';

type Item = {
  id: string;
  category: string;
  rarity: string | null;
  name: string;
  tagline: string | null;
  art_emoji: string | null;
  art_color: string | null;
  bg_gradient_start: string | null;
  bg_gradient_mid?: string | null;
  bg_gradient_end: string | null;
  price_sp: number;
  per_message: boolean | null;
  is_featured: boolean | null;
  collection_id: string | null;
  active: boolean | null;
  display_order: number | null;
};

const RARITY_OPTIONS = [
  { value: 'common',    label: 'Yaygın',    color: '#94a3b8' },
  { value: 'rare',      label: 'Nadir',     color: '#06b6d4' },
  { value: 'epic',      label: 'Destansı',  color: '#a855f7' },
  { value: 'legendary', label: 'Efsane',    color: '#f59e0b' },
  { value: 'mythic',    label: 'Mitik',     color: '#ec4899' },
];

// Hazır gradient paletleri — kullanıcı tek tıkla seçer
const GRADIENT_PRESETS = [
  { name: 'Lacivert',  start: '#1e3a8a', end: '#0f172a' },
  { name: 'Mor',       start: '#7c3aed', end: '#3b0764' },
  { name: 'Pembe',     start: '#ec4899', end: '#831843' },
  { name: 'Turuncu',   start: '#f97316', end: '#7c2d12' },
  { name: 'Altın',     start: '#fbbf24', end: '#78350f' },
  { name: 'Yeşil',     start: '#10b981', end: '#064e3b' },
  { name: 'Cyan',      start: '#06b6d4', end: '#164e63' },
  { name: 'Kırmızı',   start: '#ef4444', end: '#7f1d1d' },
  { name: 'Galaksi',   start: '#312e81', end: '#1e1b4b' },
  { name: 'Aurora',    start: '#0d9488', end: '#042f2e' },
  { name: 'Volkan',    start: '#dc2626', end: '#431407' },
  { name: 'Okyanus',   start: '#0e7490', end: '#0c4a6e' },
];

// Hediye için yaygın emojiler
const GIFT_EMOJIS = ['🎁', '🌹', '💎', '👑', '⭐', '🏆', '💝', '🎀', '🍫', '☕', '🥂', '🎂', '🪙', '💍', '🎵', '🎤', '🌟', '🔥', '⚡', '✨', '🌙', '☀️', '🌈', '🦋'];
const ENTRY_EMOJIS = ['✨', '⚡', '🌟', '💫', '🎆', '🎇', '🌠', '☄️', '🔥', '💥', '🌪️', '🌊', '⭐', '🦋', '🕊️', '🚀', '🎵', '🎤', '🌹', '👑'];
const FRAME_EMOJIS = ['🖼', '👑', '💎', '🌟', '⭐', '🌹', '🎆', '🦋', '🐉', '🌸', '🌺', '🍃'];

export default function QuickAddModal({
  category,
  onClose,
  onCreated,
}: {
  category: string;
  onClose: () => void;
  onCreated: (item: Item) => void;
}) {
  const catDef = getCategoryDef(category);
  const dialog = useAdminDialog();

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [emoji, setEmoji] = useState(catDef.emoji);
  const [gradStart, setGradStart] = useState(GRADIENT_PRESETS[0].start);
  const [gradEnd, setGradEnd] = useState(GRADIENT_PRESETS[0].end);
  const [priceSp, setPriceSp] = useState(100);
  const [rarity, setRarity] = useState<string>('common');
  const [active, setActive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedType, setUploadedType] = useState<'lottie' | 'image' | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate slug ID from name
  const generatedId = useMemo(() => {
    const slug = name
      .toLowerCase()
      .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);
    const now = Date.now().toString(36).slice(-4);
    return slug ? `${category}_${slug}_${now}` : '';
  }, [name, category]);

  // Hangi alanlar görünür kategoriye göre
  const showEmoji = ['gift', 'entry_effect', 'glow_message', 'effect', 'badge', 'emoji'].includes(category);
  const showGradient = ['frames', 'glow_message', 'gift', 'entry_effect', 'effect', 'theme', 'background'].includes(category);
  const showAssetUpload = ['frames', 'entry_effect', 'effect', 'badge', 'theme', 'background'].includes(category);
  const emojiOptions = category === 'gift' ? GIFT_EMOJIS : category === 'entry_effect' ? ENTRY_EMOJIS : FRAME_EMOJIS;

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', category);
      const res = await fetch('/yonet/api/store/upload-asset', {
        method: 'POST',
        body: fd,
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Yükleme başarısız');
      setUploadedUrl(j.url);
      setUploadedType(j.asset_type);
    } catch (e: any) {
      await dialog.alert({ title: 'Yükleme hatası', message: e.message, variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleClearAsset = () => {
    setUploadedUrl(null);
    setUploadedType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!name.trim()) {
      await dialog.alert({ title: 'İsim gerekli', message: 'Ürün için bir isim gir.', variant: 'error' });
      return;
    }
    if (priceSp < 0) {
      await dialog.alert({ title: 'Geçersiz fiyat', message: 'Fiyat 0 veya pozitif olmalı.', variant: 'error' });
      return;
    }

    setBusy(true);
    try {
      // ★ 2026-05-10 v114: asset_url top-level column'a da yaz (eko-sistem dinamik
      //   senkron — mobile cache önce buradan okuyor). Meta JSON eski yol, backward
      //   compat için kalıyor; yeni mobile sürümleri direkt asset_url'i kullanır.
      const meta = uploadedUrl ? JSON.stringify({
        asset_url: uploadedUrl,
        asset_type: uploadedType,
      }) : null;

      const payload = {
        create: {
          id: generatedId,
          category,
          rarity,
          name: name.trim(),
          tagline: tagline.trim() || null,
          meta,
          asset_url: uploadedUrl, // ★ yeni — mobile direkt buradan okur
          art_emoji: showEmoji ? emoji : (catDef.emoji || '✨'),
          art_color: gradStart,
          bg_gradient_start: showGradient ? gradStart : null,
          bg_gradient_end: showGradient ? gradEnd : null,
          price_sp: priceSp,
          is_featured: featured,
          active,
          display_order: 0,
          per_message: category === 'glow_message',
        },
      };

      const res = await fetch('/yonet/api/store/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Eklenemedi');
      }
      const j = await res.json();
      onCreated(j.item || (payload.create as any));
    } catch (e: any) {
      await dialog.alert({ title: 'Hata', message: e.message, variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  // Önizleme item objesi
  const previewItem: Item = {
    id: generatedId || 'preview',
    category,
    rarity,
    name: name || 'Ürün adı',
    tagline: tagline || null,
    art_emoji: showEmoji ? emoji : catDef.emoji,
    art_color: gradStart,
    bg_gradient_start: gradStart,
    bg_gradient_end: gradEnd,
    price_sp: priceSp,
    per_message: category === 'glow_message',
    is_featured: featured,
    collection_id: null,
    active,
    display_order: 0,
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-auto">
      <div className="bg-slate-900 border border-white/10 rounded-xl sm:rounded-2xl w-full max-w-4xl my-2 sm:my-8">
        {/* Başlık */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="text-2xl">{catDef.emoji}</span>
              Yeni {catDef.label}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{catDef.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-0">
          {/* Sol — form */}
          <div className="p-5 space-y-4">
            {/* İsim */}
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-slate-400 mb-1">
                İSİM <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={category === 'frames' ? 'ör. Altın Çerçeve' : category === 'gift' ? 'ör. Kırmızı Gül' : category === 'entry_effect' ? 'ör. Şimşek Girişi' : 'ör. Premium Mesaj'}
                className="w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none text-sm"
                autoFocus
              />
              {generatedId && (
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  ID: <code className="text-amber-300/80">{generatedId}</code> <span className="text-slate-600">(otomatik)</span>
                </div>
              )}
            </div>

            {/* Tagline (opsiyonel) */}
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-slate-400 mb-1">
                AÇIKLAMA <span className="text-slate-500 font-normal text-[9px]">(opsiyonel)</span>
              </label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="Kısa bir tanım"
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none text-sm"
                maxLength={60}
              />
            </div>

            {/* Emoji seçici (gift/entry_effect/diğer kategoriler) */}
            {showEmoji && (
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-slate-400 mb-2">
                  EMOJİ
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {emojiOptions.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${
                        emoji === e
                          ? 'bg-amber-500/20 border-2 border-amber-500/60'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={emoji}
                  onChange={e => setEmoji(e.target.value.slice(0, 4))}
                  placeholder="Veya manuel emoji yapıştır"
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none text-sm mt-2"
                  maxLength={4}
                />
              </div>
            )}

            {/* Gradient seçici */}
            {showGradient && (
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-slate-400 mb-2">
                  RENK / GRADIENT
                </label>
                <div className="grid grid-cols-6 gap-1.5 mb-3">
                  {GRADIENT_PRESETS.map(p => {
                    const isActive = p.start === gradStart && p.end === gradEnd;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => { setGradStart(p.start); setGradEnd(p.end); }}
                        className={`h-12 rounded-lg relative overflow-hidden transition-transform hover:scale-[1.05] ${isActive ? 'ring-2 ring-amber-400' : ''}`}
                        style={{ background: `linear-gradient(135deg, ${p.start}, ${p.end})` }}
                        title={p.name}
                      >
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <details className="text-xs">
                  <summary className="text-slate-400 cursor-pointer hover:text-slate-300 flex items-center gap-1">
                    <ChevronDown className="w-3 h-3" /> Manuel renk gir
                  </summary>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-1">Başlangıç</label>
                      <div className="flex gap-1">
                        <input
                          type="color"
                          value={gradStart}
                          onChange={e => setGradStart(e.target.value)}
                          className="w-9 h-9 rounded cursor-pointer bg-transparent border border-white/10"
                        />
                        <input
                          type="text"
                          value={gradStart}
                          onChange={e => setGradStart(e.target.value)}
                          className="flex-1 px-2 py-1 rounded bg-black/30 border border-white/10 text-[11px] font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-1">Bitiş</label>
                      <div className="flex gap-1">
                        <input
                          type="color"
                          value={gradEnd}
                          onChange={e => setGradEnd(e.target.value)}
                          className="w-9 h-9 rounded cursor-pointer bg-transparent border border-white/10"
                        />
                        <input
                          type="text"
                          value={gradEnd}
                          onChange={e => setGradEnd(e.target.value)}
                          className="flex-1 px-2 py-1 rounded bg-black/30 border border-white/10 text-[11px] font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            )}

            {/* Asset upload — Lottie/PNG/SVG (sadece frames, entry_effect vb için) */}
            {showAssetUpload && (
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-slate-400 mb-2">
                  ANİMASYON / GÖRSEL DOSYASI <span className="text-slate-500 font-normal text-[9px]">(opsiyonel)</span>
                </label>
                {!uploadedUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    className="border-2 border-dashed border-white/15 rounded-xl p-4 text-center cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-colors"
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                        <span className="text-xs text-slate-400">Yükleniyor...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
                        <div className="text-xs text-slate-300 font-semibold">Dosya seç veya sürükle</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Lottie (.json) · PNG · JPG · SVG · GIF · WebP — max 10 MB
                        </div>
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
                        {uploadedType === 'lottie' ? 'Lottie animasyon' : 'Görsel'} yüklendi ✓
                      </div>
                      <a
                        href={uploadedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-cyan-300 underline truncate block"
                      >
                        {uploadedUrl.split('/').pop()}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearAsset}
                      className="w-7 h-7 rounded-md bg-red-500/15 border border-red-500/40 text-red-300 flex items-center justify-center hover:bg-red-500/25"
                      title="Kaldır"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="text-[10px] text-amber-300/70 mt-2 leading-relaxed">
                  ⚠️ <strong>Mobile&apos;da görünmesi için:</strong> Yüklenen dosyalar Storage&apos;da hazır.
                  Mobile app&apos;te <code className="bg-black/40 px-1 rounded">AvatarFrame</code> + <code className="bg-black/40 px-1 rounded">EntryEffect</code> component&apos;lerine
                  &quot;runtime URL fetch&quot; desteği eklenip yeni APK build alındığında otomatik gözükür.
                </div>
              </div>
            )}

            {/* Fiyat + nadirlik */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-slate-400 mb-1">
                  FİYAT (SP)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={priceSp}
                    onChange={e => setPriceSp(parseInt(e.target.value, 10) || 0)}
                    min={0}
                    step={50}
                    className="w-full px-3 py-2.5 pr-10 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none text-sm font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-300 text-xs font-bold">SP</span>
                </div>
                <div className="flex gap-1 mt-1">
                  {[50, 100, 250, 500, 1000].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriceSp(p)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-slate-400 mb-1">
                  NADİRLİK
                </label>
                <select
                  value={rarity}
                  onChange={e => setRarity(e.target.value)}
                  aria-label="Nadirlik"
                  className="w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none text-sm"
                >
                  {RARITY_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Toggle'lar */}
            <div className="flex items-center gap-5 pt-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
                <span className="text-slate-300">Yayında</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
                <span className="text-slate-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Öne çıkan
                </span>
              </label>
            </div>
          </div>

          {/* Sağ — canlı önizleme */}
          <div className="border-t md:border-t-0 md:border-l border-white/10 p-4 bg-black/20">
            <div className="text-[10px] tracking-wider text-slate-400 mb-3 font-bold text-center">
              📱 CANLI ÖNİZLEME
            </div>
            <div className="scale-90 origin-top">
              <MobilePreview item={previewItem} />
            </div>
          </div>
        </div>

        {/* Aksiyon */}
        <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between gap-3">
          <span className="text-[10px] text-slate-500">
            ID otomatik üretilir, daha sonra düzenlenemez.
          </span>
          <div className="flex gap-2">
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
              disabled={busy || !name.trim()}
              className="px-5 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-sm font-bold hover:bg-amber-500/30 disabled:opacity-50 flex items-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Mağazaya Ekle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
