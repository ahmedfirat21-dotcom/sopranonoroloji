"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SopranoLogoMini, { SopranoLogoStyleTag } from '../_components/SopranoLogoMini';

export default function YonetGirisPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Callback redirect'ten ?err= ile gelen mesajları göster.
  // ★ useSearchParams Next 16'da Suspense boundary istiyor; window.location.search
  //   ile direkt parse — bu sayfa client'ta render olduğu için sorun çıkmaz.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const err = params.get('err');
    if (err) setError(err);
  }, []);

  const handleGoogleLogin = () => {
    setError(null);
    setLoading(true);
    // Server-side redirect: state cookie + Google auth URL
    window.location.href = '/yonet/api/auth/google/start';
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center text-slate-100 p-4 sm:p-6 overflow-auto"
      style={{ background: '#0A0F1A', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
    >
      <SopranoLogoStyleTag />

      {/* Ambient glow — landing-new ile birebir aynı palet */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 20% 0%, rgba(78, 176, 168, 0.15), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 100%, rgba(123, 159, 239, 0.10), transparent 60%)',
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Üst — SopranoLogo + YÖNETİM pill */}
        <div className="flex flex-col items-center mb-7">
          <Link href="/" aria-label="Anasayfa" className="mb-4">
            <SopranoLogoMini size="lg" />
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
            <span className="text-[11px] font-semibold tracking-[0.25em] text-amber-300">
              YÖNETİM ERİŞİMİ
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-3">Yetkili Google hesabı ile giriş</p>
        </div>

        {/* Google ile Giriş butonu */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-white text-[#0A0F1A] font-semibold text-sm transition-all hover:bg-slate-100 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-lg"
        >
          {/* Google G logo (SVG inline) */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.55c2.08-1.92 3.29-4.74 3.29-8.09Z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.55-2.76c-.98.66-2.24 1.05-3.73 1.05-2.87 0-5.3-1.94-6.16-4.54H2.18v2.85A11 11 0 0 0 12 23Z" />
            <path fill="#FBBC04" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.85Z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.46 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.85C6.7 7.32 9.13 5.38 12 5.38Z" />
          </svg>
          {loading ? 'Yönlendiriliyor…' : 'Google ile Giriş Yap'}
        </button>

        {error && (
          <div className="mt-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mt-6 text-[10px] text-slate-500">
          <span>Yetkisiz girişler loglanır.</span>
          <Link href="/" className="hover:text-cyan-300 transition-colors">
            ← Ana site
          </Link>
        </div>
      </div>
    </div>
  );
}
