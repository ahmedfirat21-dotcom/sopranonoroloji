"use client";

/**
 * SopranoChat Admin — Asset Upload Button
 * ═══════════════════════════════════════════════════════════════════
 * Mevcut bir kozmetik ürünün asset'ini (Lottie JSON / PNG / WebP)
 * yükler veya değiştirir. Upload sonrası cosmetic_items.asset_url
 * otomatik DB'ye yazılır (eko-sistem dinamik senkron).
 *
 * Kullanım:
 *   <AssetUploadButton itemId="gold-royal" category="frames"
 *     currentUrl={item.asset_url} onUploaded={(url) => ...} />
 */
import React, { useRef, useState } from 'react';
import { Upload, FileCheck2, Loader2, X } from 'lucide-react';
import { useAdminDialog } from '../../_components/AdminDialog';

interface Props {
  itemId: string;
  category: string;
  currentUrl?: string | null;
  onUploaded?: (url: string, type: 'lottie' | 'image') => void;
  size?: 'sm' | 'md';
}

export default function AssetUploadButton({ itemId, category, currentUrl, onUploaded, size = 'sm' }: Props) {
  const dialog = useAdminDialog();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [hasAsset, setHasAsset] = useState(!!currentUrl);

  const handleSelect = () => inputRef.current?.click();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Boyut kontrol — 10MB
    if (file.size > 10 * 1024 * 1024) {
      await dialog.alert({ title: 'Dosya çok büyük', message: 'Maks 10 MB olabilir.', variant: 'error' });
      e.target.value = '';
      return;
    }

    // Tip kontrol
    const allowed = ['application/json', 'image/png', 'image/jpeg', 'image/svg+xml', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      await dialog.alert({
        title: 'Geçersiz tip',
        message: `${file.type} kabul edilmiyor. JSON (Lottie), PNG, JPG, SVG, GIF, WebP olabilir.`,
        variant: 'error',
      });
      e.target.value = '';
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', category);
      fd.append('item_id', itemId); // ★ DB autoupdate tetikler

      const res = await fetch('/yonet/api/store/upload-asset', { method: 'POST', body: fd });
      const j = await res.json();

      if (!res.ok || !j.ok) {
        throw new Error(j.error || 'Yükleme başarısız');
      }

      setHasAsset(true);
      onUploaded?.(j.url, j.asset_type);

      const dbInfo = j.db_updated
        ? '✓ DB asset_url güncellendi'
        : (j.db_error ? `DB hatası: ${j.db_error}` : 'DB güncellenmedi');

      await dialog.alert({
        title: '✓ Yüklendi',
        message: `${file.name}\n${dbInfo}\n\nMobile'da APK build gerekmez — yeni ürün anında görünür.`,
        variant: 'success',
      });
    } catch (err: any) {
      await dialog.alert({ title: 'Hata', message: err.message, variant: 'error' });
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const handleClear = async () => {
    const confirmed = await dialog.confirm({
      title: 'Asset URL\'i temizle?',
      message: 'cosmetic_items.asset_url NULL olacak. Mobile registry fallback\'ine düşer.',
      confirmText: 'Temizle',
      variant: 'warning',
    });
    if (!confirmed) return;

    setBusy(true);
    try {
      const res = await fetch(`/yonet/api/store/items/${encodeURIComponent(itemId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ update: { asset_url: null } }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Temizlik başarısız');
      }
      setHasAsset(false);
      onUploaded?.('', 'image');
    } catch (err: any) {
      await dialog.alert({ title: 'Hata', message: err.message, variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const baseClasses = size === 'sm'
    ? 'px-2 py-1 text-[11px]'
    : 'px-3 py-2 text-sm';

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".json,.png,.jpg,.jpeg,.svg,.gif,.webp,application/json,image/*"
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={handleSelect}
        disabled={busy}
        className={`${baseClasses} inline-flex items-center gap-1 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
          hasAsset
            ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
            : 'bg-slate-700/40 border border-slate-600/50 text-slate-300 hover:bg-slate-700/60'
        }`}
        title={hasAsset ? 'Asset değiştir (mevcut: ' + (currentUrl ? currentUrl.split('/').pop() : 'var') + ')' : 'Asset yükle'}
      >
        {busy ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : hasAsset ? (
          <FileCheck2 className="w-3 h-3" />
        ) : (
          <Upload className="w-3 h-3" />
        )}
        {size === 'md' && (hasAsset ? 'Asset Değiştir' : 'Asset Yükle')}
      </button>
      {hasAsset && !busy && (
        <button
          type="button"
          onClick={handleClear}
          className={`${baseClasses} inline-flex items-center rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition-colors`}
          title="Asset URL'i temizle"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
