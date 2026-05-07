/**
 * SopranoChat — Kullanıcı profili paylaşım linki handler.
 * /user/[id] sayfası: mobile uygulamaya intent:// ile yönlendirir.
 */
'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Smartphone } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase/admin';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.sopranochat';

export default function UserProfileLandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [name, setName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [autoRedirected, setAutoRedirected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('display_name, username, avatar_url, subscription_tier, is_verified')
          .eq('id', id)
          .single();
        if (cancelled || !data) return;
        setName(data.display_name || null);
        setUsername(data.username || null);
        setAvatar(data.avatar_url || null);
        setTier(data.subscription_tier || null);
        setVerified(!!data.is_verified);
      } catch {
        /* yok say */
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (autoRedirected) return;
    const intentUrl = `intent://user/${id}#Intent;scheme=sopranochat;package=com.sopranochat;S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;
    const timer = setTimeout(() => {
      setAutoRedirected(true);
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('android')) {
        window.location.href = intentUrl;
      } else if (ua.includes('iphone') || ua.includes('ipad')) {
        window.location.href = `sopranochat://user/${id}`;
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [id, autoRedirected]);

  const tierColor = tier === 'Pro' ? '#FBBF24' : tier === 'Plus' ? '#5EEAD4' : null;

  return (
    <div
      className="min-h-screen flex items-center justify-center text-slate-100 p-4"
      style={{ background: '#0A0F1A', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
    >
      <style>{`
        html { zoom: 1 !important; background: #0A0F1A !important; min-height: 100vh !important; }
        body { background: #0A0F1A !important; min-height: 100vh !important; }
        @import url('https://fonts.cdnfonts.com/css/cooper-black');
        @keyframes scUserLogoGlow {
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
          animation: scUserLogoGlow 3s ease-in-out infinite;
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
      `}</style>

      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 20% 0%, rgba(78, 176, 168, 0.15), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 100%, rgba(123, 159, 239, 0.10), transparent 60%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" aria-label="Anasayfa" className="sc-logo">
            <span className="sc-logo-soprano">Soprano</span>
            <span className="sc-logo-chat">Chat</span>
            <span className="sc-logo-tagline">Senin Sesin</span>
          </Link>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-7 sm:p-8 backdrop-blur-md text-center">
          {/* Avatar */}
          <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-white/10 bg-slate-800 flex items-center justify-center">
            {avatar ? (
              <Image src={avatar} alt={name || 'Kullanıcı'} width={96} height={96} className="w-full h-full object-cover" unoptimized />
            ) : (
              <User className="w-10 h-10 text-slate-500" />
            )}
          </div>

          {/* Tier rozeti */}
          {tier && tier !== 'Free' && (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full mb-3"
              style={{
                background: `${tierColor}1a`,
                border: `1px solid ${tierColor}40`,
                color: tierColor || '#fff',
              }}
            >
              <span className="text-[10px] font-bold tracking-[0.2em]">{tier.toUpperCase()}</span>
            </div>
          )}

          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mb-1 leading-tight flex items-center justify-center gap-1.5">
            {name || 'SopranoChat Kullanıcısı'}
            {verified && <span className="text-cyan-300 text-base" title="Doğrulanmış">✓</span>}
          </h1>

          {username && (
            <p className="text-sm text-slate-500 mb-6">@{username}</p>
          )}

          {!username && <div className="mb-6" />}

          <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-sm mx-auto">
            Bu kullanıcının profilini görmek, takip etmek veya mesaj atmak için SopranoChat uygulamasını aç.
          </p>

          <a
            href={`intent://user/${id}#Intent;scheme=sopranochat;package=com.sopranochat;S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`}
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
