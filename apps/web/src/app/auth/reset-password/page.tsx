/**
 * SopranoChat — Firebase Auth Action Handler
 * /auth/reset-password sayfası: Firebase email verify, şifre sıfırlama, email kurtarma
 * linklerini karşılar. Modu URL'den okur, sade Türkçe mesaj gösterir, mobile
 * uygulamaya intent:// ile yönlendirir.
 *
 * URL formatı: /auth/reset-password?mode={verifyEmail|resetPassword|recoverEmail}&oobCode=...
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, CheckCircle2, KeyRound, Smartphone, AlertCircle } from 'lucide-react';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.sopranochat';

type Mode = 'verifyEmail' | 'resetPassword' | 'recoverEmail' | 'unknown';

const MODE_INFO: Record<Mode, { title: string; subtitle: string; cta: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string }> = {
  verifyEmail: {
    title: 'E-posta adresin doğrulandı',
    subtitle: 'Artık SopranoChat hesabınla giriş yapabilirsin. Uygulamayı aç ve sesini koroya katıl.',
    cta: 'Uygulamayı Aç',
    icon: CheckCircle2,
    color: '#5EEAD4',
  },
  resetPassword: {
    title: 'Şifre sıfırlama',
    subtitle: 'Şifrenizi yeni baştan oluşturmak için SopranoChat uygulamasına dön. Mobil uygulamada güvenli olarak halledelim.',
    cta: 'Uygulamada Sıfırla',
    icon: KeyRound,
    color: '#FBBF24',
  },
  recoverEmail: {
    title: 'E-posta kurtarma',
    subtitle: 'Hesabına bağlı e-postayı geri almak için SopranoChat uygulamasına dön.',
    cta: 'Uygulamayı Aç',
    icon: Mail,
    color: '#F472B6',
  },
  unknown: {
    title: 'Bağlantı geçersiz veya süresi dolmuş',
    subtitle: 'Bu doğrulama bağlantısı artık çalışmıyor. Yeni bir bağlantı için uygulamadan tekrar talepte bulun.',
    cta: 'Uygulamayı Aç',
    icon: AlertCircle,
    color: '#F87171',
  },
};

export default function ResetPasswordPage() {
  const [mode, setMode] = useState<Mode>('unknown');
  const [oobCode, setOobCode] = useState<string>('');
  const [autoRedirected, setAutoRedirected] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mode') as Mode;
    const code = params.get('oobCode') || '';

    if (m && ['verifyEmail', 'resetPassword', 'recoverEmail'].includes(m)) {
      setMode(m);
    } else {
      setMode('unknown');
    }
    setOobCode(code);
  }, []);

  // ★ v110.10 (7 May 2026): AGRESİF redirect — kullanıcı talebi
  //   "geri dönüşler web e değil uygulamaya olsun".
  //   500ms gecikme: kullanıcı sayfa flash'ını görür ama uygulama hemen açılır.
  //   App Links autoVerify:true + assetlinks.json ile Android Chrome zaten bu URL'i
  //   uygulamaya yönlendirir; bu redirect fallback (autoVerify çalışmadıysa).
  useEffect(() => {
    if (mode === 'unknown' || autoRedirected) return;
    const params = new URLSearchParams(window.location.search);
    const queryString = params.toString();
    const intentUrl = `intent://auth/reset-password?${queryString}#Intent;scheme=sopranochat;package=com.sopranochat;S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;

    const timer = setTimeout(() => {
      setAutoRedirected(true);
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('android')) {
        window.location.href = intentUrl;
      } else if (ua.includes('iphone') || ua.includes('ipad')) {
        window.location.href = `sopranochat://auth/reset-password?${queryString}`;
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [mode, autoRedirected]);

  const info = MODE_INFO[mode];
  const Icon = info.icon;

  return (
    <div
      className="min-h-screen flex items-center justify-center text-slate-100 p-4"
      style={{ background: '#0A0F1A', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
    >
      <style>{`
        html { zoom: 1 !important; background: #0A0F1A !important; min-height: 100vh !important; }
        body { background: #0A0F1A !important; min-height: 100vh !important; }
        @import url('https://fonts.cdnfonts.com/css/cooper-black');
        @keyframes scAuthLogoGlow {
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
          animation: scAuthLogoGlow 3s ease-in-out infinite;
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
        <div className="flex justify-center mb-8">
          <Link href="/" aria-label="Anasayfa" className="sc-logo">
            <span className="sc-logo-soprano">Soprano</span>
            <span className="sc-logo-chat">Chat</span>
            <span className="sc-logo-tagline">Senin Sesin</span>
          </Link>
        </div>

        {/* Status kart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-7 sm:p-8 backdrop-blur-md text-center">
          <div
            className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{
              background: `${info.color}1a`,
              border: `1px solid ${info.color}40`,
            }}
          >
            <Icon className="w-8 h-8" style={{ color: info.color }} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mb-3 leading-tight">
            {info.title}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed mb-7 max-w-sm mx-auto">
            {info.subtitle}
          </p>

          {/* CTA — mobile app açma */}
          {mode !== 'unknown' && oobCode && (
            <a
              href={`intent://auth/reset-password?mode=${mode}&oobCode=${oobCode}#Intent;scheme=sopranochat;package=com.sopranochat;S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`}
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-[#0A0F1A] font-bold text-sm tracking-wider transition-transform hover:scale-[1.01]"
              style={{
                background: 'linear-gradient(180deg, #fde68a 0%, #f59e0b 100%)',
                boxShadow: '0 12px 30px -8px rgba(245, 158, 11, 0.5)',
              }}
            >
              <Smartphone className="w-5 h-5" />
              {info.cta}
            </a>
          )}

          {/* Play Store fallback */}
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-4 text-xs text-slate-500 hover:text-cyan-300 transition-colors"
          >
            Uygulamam yüklü değilse → Google Play&apos;den indir
          </a>
        </div>

        {/* Footer minimal */}
        <p className="text-center text-[11px] text-slate-600 mt-6">
          SopranoChat · sopranochat@gmail.com
        </p>
      </div>
    </div>
  );
}
