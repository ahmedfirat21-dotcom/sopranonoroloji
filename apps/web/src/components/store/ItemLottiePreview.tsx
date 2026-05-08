'use client';

/**
 * Web admin — küçük Lottie önizlemesi (mağaza mini kartları için).
 *
 * Cosmetic item id'sine bakıp registry'den Lottie URL'sini alır, varsa
 * canlı animasyon oynatır; yoksa fallback olarak verilen emoji'yi gösterir.
 *
 * Yöneticinin mini kartta gördüğü ile mobil kullanıcının gerçek hediye/
 * çerçeve animasyonu birebir aynı olsun diye var.
 */

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { getItemLottieUrl } from '@/lib/lottieAssets';

// lottie-react SSR'da çalışmaz (window'a bağımlı), client-only dynamic import
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface Props {
  itemId: string;
  /** Lottie yoksa fallback olarak gösterilecek emoji */
  fallbackEmoji?: string | null;
  /** Kart boyutu (px) — default 48 (w-12 h-12) */
  size?: number;
  /** Tailwind ek className (örn rounded-lg) */
  className?: string;
}

export default function ItemLottiePreview({
  itemId,
  fallbackEmoji,
  size = 48,
  className = '',
}: Props) {
  const url = getItemLottieUrl(itemId);
  const [data, setData] = useState<unknown | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
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
  }, [url]);

  // Lottie yoksa veya yüklenemediyse emoji fallback
  if (!url || failed) {
    return (
      <div
        className={`flex items-center justify-center text-2xl ${className}`}
        style={{ width: size, height: size }}
      >
        {fallbackEmoji || '📦'}
      </div>
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
