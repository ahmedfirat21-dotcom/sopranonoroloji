'use client';

/**
 * Web admin — kozmetik ürün asset önizlemesi.
 *
 * Öncelik sırası:
 *   1. Prop olarak geçilen `assetUrl` (DB'deki cosmetic_items.asset_url)
 *      — yönetici az önce yüklediyse bunu görür
 *   2. Hardcoded registry (eski hediye/çerçeve mapping'i — geri uyumluluk)
 *   3. Emoji fallback
 *
 * URL `.json` ile bitiyorsa Lottie animasyon, başka her uzantı ise <img>
 * (PNG/JPG/SVG/GIF/WebP).
 */

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { getItemLottieUrl } from '@/lib/lottieAssets';

// lottie-react SSR'da çalışmaz (window'a bağımlı), client-only dynamic import
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface Props {
  itemId: string;
  /** DB'den gelen asset_url — varsa registry'den önce kullanılır */
  assetUrl?: string | null;
  /** Asset yoksa fallback olarak gösterilecek emoji */
  fallbackEmoji?: string | null;
  /** Kart boyutu (px) — default 48 (w-12 h-12) */
  size?: number;
  /** Tailwind ek className (örn rounded-lg) */
  className?: string;
}

export default function ItemLottiePreview({
  itemId,
  assetUrl,
  fallbackEmoji,
  size = 48,
  className = '',
}: Props) {
  // 1) DB asset_url öncelikli, 2) yoksa hardcoded registry
  const url = assetUrl || getItemLottieUrl(itemId);
  const isJson = !!url && /\.json($|\?)/i.test(url);
  const [data, setData] = useState<unknown | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url || !isJson) return;
    let cancelled = false;
    setData(null);
    setFailed(false);
    fetch(url)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('fetch failed'))))
      .then(json => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [url, isJson]);

  // Hiç URL yoksa veya Lottie yüklenemediyse emoji fallback
  if (!url || (isJson && failed)) {
    return (
      <div
        className={`flex items-center justify-center text-2xl ${className}`}
        style={{ width: size, height: size }}
      >
        {fallbackEmoji || '📦'}
      </div>
    );
  }

  // PNG/JPG/SVG/GIF/WebP — direkt <img>
  if (!isJson) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className={className}
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
    );
  }

  // Lottie URL var ama JSON daha yüklenmediyse boş alan tutucu
  if (!data) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="w-1/2 h-1/2 rounded-full border-2 border-white/10 border-t-white/30 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ width: size, height: size, overflow: 'hidden' }}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Lottie animationData={data as any} loop autoplay style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
