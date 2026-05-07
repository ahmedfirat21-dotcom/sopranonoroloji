/**
 * SopranoChat — Landing (ilk versiyon: 4 feature card, kategori/tier yok).
 * Logo: projedeki gerçek Cooper Black gradient text logo.
 * Telefon mockup: PhoneSimulator (5 sekmeli mobil app simülasyonu).
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Smartphone, Mail, MessageSquare, Sparkles, Crown, Radio } from 'lucide-react';
import PhoneSimulator from './PhoneSimulator';

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.sopranochat';

async function loadStats() {
  try {
    const [users, liveRooms] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('rooms').select('id', { count: 'exact', head: true }).eq('is_live', true),
    ]);
    return { users: users.count || 0, liveRooms: liveRooms.count || 0 };
  } catch {
    return { users: 0, liveRooms: 0 };
  }
}

export default async function LandingPage() {
  const stats = await loadStats();

  return (
    <div className="min-h-screen text-slate-100" style={{ background: '#0A0F1A', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* ★ 7 May 2026: globals.css'teki html bg gradient + zoom:0.90 alttan/sağdan
          taşıyordu (kullanıcı raporu). Landing'de zoom:1 + dark bg ile örtüyoruz. */}
      <style>{`
        html { zoom: 1 !important; background: #0A0F1A !important; min-height: 100vh !important; }
        body { background: #0A0F1A !important; min-height: 100vh !important; }
      `}</style>
      {/* Logo CSS — projedeki HomePage'den birebir alındı */}
      <style>{`
        @import url('https://fonts.cdnfonts.com/css/cooper-black');
        @keyframes logoGlow {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(120,200,200,0)) drop-shadow(0 2px 4px rgba(0,0,0,0.6)); }
          50% { filter: drop-shadow(0 0 8px rgba(120,200,200,0.3)) drop-shadow(0 0 20px rgba(120,200,200,0.1)) drop-shadow(0 2px 4px rgba(0,0,0,0.6)); }
        }
        .sc-logo {
          font-family: 'Cooper Black', 'Arial Rounded MT Bold', serif;
          font-weight: 900;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: flex-end;
        }
        .sc-logo-soprano {
          background: linear-gradient(180deg, #ffffff 0%, #dde4ee 35%, #b8c2d4 70%, #ccd4e4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6)) drop-shadow(1px 1px 0 rgba(0,0,0,0.4));
        }
        .sc-logo-chat {
          background: linear-gradient(180deg, #b8f0f0 0%, #5ec8c8 30%, #3a9e9e 65%, #4db0a8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6)) drop-shadow(1px 1px 0 rgba(20,80,70,0.5));
          animation: logoGlow 3s ease-in-out infinite;
        }
        .sc-logo-tagline {
          font-family: 'Cooper Black', 'Arial Rounded MT Bold', sans-serif;
          letter-spacing: 1.5px;
          background: linear-gradient(180deg, #ffffff 0%, #dde4ee 35%, #b8c2d4 70%, #ccd4e4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
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

      {/* Header — sadece logo */}
      <header className="relative z-10 px-4 sm:px-8 py-5 max-w-5xl mx-auto">
        <SopranoLogo size="lg" />
      </header>

      {/* Hero */}
      <section className="relative z-10 px-4 sm:px-8 py-12 sm:py-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[11px] font-semibold tracking-wider text-emerald-300">
                {stats.liveRooms > 0 ? `${stats.liveRooms} ODA CANLI` : 'YAYIN HAZIR'}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] mb-5 text-slate-50">
              Sesinle{' '}
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-fuchsia-300 bg-clip-text text-transparent">
                tanış
              </span>
              <br />
              ses koroyla{' '}
              <span className="text-cyan-300">büyü</span>.
            </h1>
            <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-md leading-relaxed">
              SopranoChat — sade, özgün, sesli sosyal platform. Canlı odalar, doğrudan mesaj, ve seninle aynı frekansta insanlarla buluşma.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={GOOGLE_PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[#0A0F1A] font-bold text-sm tracking-wider transition-transform hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(180deg, #fde68a 0%, #f59e0b 100%)',
                  boxShadow: '0 12px 30px -8px rgba(245, 158, 11, 0.5)',
                }}
              >
                <Smartphone className="w-5 h-5" />
                Google Play&apos;de İndir
              </a>
            </div>

            <div className="flex items-center gap-6 mt-8 text-xs text-slate-400">
              <div>
                <div className="text-2xl font-bold text-slate-100">{stats.users.toLocaleString('tr-TR')}</div>
                <div className="text-[10px] tracking-wider">KULLANICI</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <div className="text-2xl font-bold text-emerald-300">{stats.liveRooms}</div>
                <div className="text-[10px] tracking-wider">CANLI ODA</div>
              </div>
            </div>
          </div>

          {/* Telefon — PhoneSimulator (5 sekme rotasyonu) */}
          <div className="flex justify-center">
            <PhoneSimulator />
          </div>
        </div>
      </section>

      {/* 4 feature card */}
      <section className="relative z-10 px-4 sm:px-8 py-12 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center text-slate-100">
          Ne sunuyor?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Feature
            Icon={Radio}
            color="#10b981"
            title="Canlı Sesli Odalar"
            body="Clubhouse tarzı, anında katıl, anında konuş."
          />
          <Feature
            Icon={MessageSquare}
            color="#06b6d4"
            title="Doğrudan Mesaj"
            body="Sesli mesaj, görsel, reaksiyon. Anında bağlan."
          />
          <Feature
            Icon={Crown}
            color="#f59e0b"
            title="SP Ekonomisi"
            body="Konuş, kazan, hediye gönder, premium ol."
          />
          <Feature
            Icon={Sparkles}
            color="#a855f7"
            title="Mağaza & Çerçeveler"
            body="Profilini özelleştir, parla."
          />
        </div>
      </section>

      {/* Final CTA */}
      {/* ★ 7 May 2026: Alt CTA section + 2. Google Play butonu kaldırıldı (kullanıcı talebi).
          Hero'daki tek buton zeten yeterli; çift CTA tekrar hissi yaratıyordu.
          Canlı oda sayısı zeten hero stats bloğunda gösteriliyor. */}

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-8 py-8 border-t border-white/5 mt-12">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <SopranoLogo size="sm" muted />
          <a
            href="mailto:sopranochat@gmail.com"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <Mail className="w-3 h-3" /> sopranochat@gmail.com
          </a>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────── Logo component ─────────────── */
function SopranoLogo({
  size = 'md',
  muted = false,
  showTagline = true,
  secondPart = 'Chat',
}: {
  size?: 'sm' | 'md' | 'lg';
  muted?: boolean;
  showTagline?: boolean;
  secondPart?: string;
}) {
  // Tagline absolute pozisyonlu — Chat ve Soprano aynı baseline'da yan yana, tagline altta.
  const sizes = {
    sm: { soprano: 22, chat: 22, tagline: 6.5 },
    md: { soprano: 32, chat: 32, tagline: 9 },
    lg: { soprano: 44, chat: 44, tagline: 11 },
  } as const;
  const s = sizes[size];
  return (
    <div
      className="sc-logo"
      style={{
        opacity: muted ? 0.7 : 1,
        lineHeight: 1,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'baseline',
        paddingBottom: showTagline ? s.tagline + 2 : 0,
      }}
    >
      <span className="sc-logo-soprano" style={{ fontSize: s.soprano, lineHeight: 1 }}>Soprano</span>
      <span className="sc-logo-chat" style={{ fontSize: s.chat, lineHeight: 1, marginLeft: 1 }}>{secondPart}</span>
      {showTagline && (
        <span
          className="sc-logo-tagline"
          style={{
            fontSize: s.tagline,
            fontStyle: 'normal',
            position: 'absolute',
            right: 0,
            bottom: 0,
            lineHeight: 1,
          }}
        >
          Senin Sesin
        </span>
      )}
    </div>
  );
}

function Feature({
  Icon, color, title, body,
}: {
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string; title: string; body: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur hover:bg-white/[0.07] transition-colors">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
        style={{ background: `${color}20`, border: `1px solid ${color}40` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <h3 className="font-bold text-sm mb-1.5">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed">{body}</p>
    </div>
  );
}
