"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, KeyRound } from 'lucide-react';
import SopranoLogoMini, { SopranoLogoStyleTag } from '../_components/SopranoLogoMini';

export default function YonetGirisPage() {
  const router = useRouter();
  const [accessKey, setAccessKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/yonet/api/giris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey: accessKey.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Giriş başarısız');
        setSubmitting(false);
        return;
      }
      router.replace('/yonet');
    } catch {
      setError('Bağlantı hatası');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center text-slate-100 p-4 sm:p-6 overflow-hidden"
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

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl"
      >
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
          <p className="text-xs text-slate-400 mt-3">Erişim anahtarı ile giriş</p>
        </div>

        <label className="block text-[11px] font-semibold text-slate-300 mb-2 tracking-[0.18em]">
          ERİŞİM ANAHTARI
        </label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="password"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            placeholder="••••••••••"
            autoFocus
            className="w-full pl-9 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-500/50 focus:bg-black/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-slate-100 text-sm transition-all"
          />
        </div>

        {error && (
          <div className="mt-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* CTA — landing'deki "Google Play'de İndir" amber gradient buton dili */}
        <button
          type="submit"
          disabled={submitting || !accessKey}
          className="w-full mt-6 py-3 rounded-xl text-[#0A0F1A] font-bold text-sm tracking-[0.18em] transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(180deg, #fde68a 0%, #f59e0b 100%)',
            boxShadow: '0 12px 30px -8px rgba(245, 158, 11, 0.5)',
          }}
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          GİRİŞ YAP
        </button>

        <div className="flex items-center justify-between mt-6 text-[10px] text-slate-500">
          <span>Yetkisiz girişler loglanır.</span>
          <Link href="/" className="hover:text-cyan-300 transition-colors">
            ← Ana site
          </Link>
        </div>
      </form>
    </div>
  );
}
