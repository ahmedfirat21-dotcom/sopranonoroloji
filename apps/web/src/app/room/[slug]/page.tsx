/**
 * SopranoChat — Oda paylaşım linki handler.
 * /room/[slug] sayfası: mobile uygulamaya intent:// ile yönlendirir.
 * Eski karmaşık web room client'ı kaldırıldı — paylaşılan link tek amacı
 * uygulamaya götürmek.
 */
'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Radio, Smartphone } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase/admin';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.sopranochat';

export default function RoomLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [listenerCount, setListenerCount] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [autoRedirected, setAutoRedirected] = useState(false);

  // Oda metadata'sını DB'den çek (önizleme için)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabaseAdmin
          .from('rooms')
          .select('name, listener_count, is_live, profiles!rooms_host_id_fkey(display_name)')
          .eq('id', slug)
          .single();
        if (cancelled || !data) return;
        setRoomName(data.name || null);
        setListenerCount(data.listener_count ?? 0);
        setIsLive(!!data.is_live);
        const host: any = (data as any).profiles;
        setHostName(host?.display_name || null);
      } catch {
        /* yok say */
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  // Otomatik intent:// redirect — Android'de uygulamaya götürür
  useEffect(() => {
    if (autoRedirected) return;
    const intentUrl = `intent://room/${slug}#Intent;scheme=sopranochat;package=com.sopranochat;S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;
    const timer = setTimeout(() => {
      setAutoRedirected(true);
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('android')) {
        window.location.href = intentUrl;
      } else if (ua.includes('iphone') || ua.includes('ipad')) {
        window.location.href = `sopranochat://room/${slug}`;
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [slug, autoRedirected]);

  return (
    <div
      className="min-h-screen flex items-center justify-center text-slate-100 p-4"
      style={{ background: '#0A0F1A', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
    >
      <style>{`
        html { zoom: 1 !important; background: #0A0F1A !important; min-height: 100vh !important; }
        body { background: #0A0F1A !important; min-height: 100vh !important; }
        @import url('https://fonts.cdnfonts.com/css/cooper-black');
        @keyframes scRoomLogoGlow {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(120,200,200,0)) drop-shadow(0 2px 4px rgba(0,0,0,0.6)); }
          50% { filter: drop-shadow(0 0 8px rgba(120,200,200,0.3)) drop-shadow(0 0 20px rgba(120,200,200,0.1)) drop-shadow(0 2px 4px rgba(0,0,0,0.6)); }
        }
        .sc-logo {
          font-family: 'Cooper Black', 'Arial Rounded MT Bold', serif;
          font-weight: 900;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: baseline;
          line-height: 1;
          position: relative;
          padding-bottom: 11px;
        }
        .sc-logo-soprano {
          font-size: 32px;
          background: linear-gradient(180deg, #ffffff 0%, #dde4ee 35%, #b8c2d4 70%, #ccd4e4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));
        }
        .sc-logo-chat {
          font-size: 32px;
          margin-left: 1px;
          background: linear-gradient(180deg, #b8f0f0 0%, #5ec8c8 30%, #3a9e9e 65%, #4db0a8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));
          animation: scRoomLogoGlow 3s ease-in-out infinite;
        }
        .sc-logo-tagline {
          font-family: 'Cooper Black', sans-serif;
          letter-spacing: 1.5px;
          font-size: 9px;
          position: absolute;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, #ffffff 0%, #b8c2d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .live-dot { animation: pulseDot 1.4s ease-in-out infinite; }
      `}</style>

      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 20% 0%, rgba(78, 176, 168, 0.15), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 100%, rgba(123, 159, 239, 0.10), transparent 60%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/" aria-label="Anasayfa" className="sc-logo">
            <span className="sc-logo-soprano">Soprano</span>
            <span className="sc-logo-chat">Chat</span>
            <span className="sc-logo-tagline">Senin Sesin</span>
          </Link>
        </div>

        {/* Oda kartı */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-7 sm:p-8 backdrop-blur-md text-center">
          {/* Canlılık durumu */}
          {isLive && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 mb-4">
              <span className="live-dot w-1.5 h-1.5 bg-red-400 rounded-full" />
              <span className="text-[11px] font-semibold tracking-[0.2em] text-red-300">CANLI</span>
            </div>
          )}

          <div
            className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(20, 184, 166, 0.1)',
              border: '1px solid rgba(20, 184, 166, 0.4)',
            }}
          >
            <Radio className="w-8 h-8" style={{ color: '#5EEAD4' }} />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2 leading-tight">
            {roomName || 'Sesli sohbet odası'}
          </h1>

          {hostName && (
            <p className="text-sm text-slate-400 mb-1">
              <span className="text-slate-500">Sahip:</span>{' '}
              <span className="text-slate-200 font-semibold">{hostName}</span>
            </p>
          )}

          {typeof listenerCount === 'number' && (
            <p className="text-xs text-slate-500 mb-7">
              {listenerCount} kişi dinliyor
            </p>
          )}

          {!hostName && !listenerCount && <div className="mb-7" />}

          <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-sm mx-auto">
            Bu odaya katılmak için SopranoChat uygulamasını aç. Sesini ekle, sahneye çık, sohbete katıl.
          </p>

          <a
            href={`intent://room/${slug}#Intent;scheme=sopranochat;package=com.sopranochat;S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`}
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-[#0A0F1A] font-bold text-sm tracking-wider transition-transform hover:scale-[1.01]"
            style={{
              background: 'linear-gradient(180deg, #fde68a 0%, #f59e0b 100%)',
              boxShadow: '0 12px 30px -8px rgba(245, 158, 11, 0.5)',
            }}
          >
            <Smartphone className="w-5 h-5" />
            Uygulamada Aç
          </a>

          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-4 text-xs text-slate-500 hover:text-cyan-300 transition-colors"
          >
            Uygulamam yüklü değilse → Google Play&apos;den indir
          </a>
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-6">
          SopranoChat · Sesinle tanış
        </p>
      </div>
    </div>
  );
}
