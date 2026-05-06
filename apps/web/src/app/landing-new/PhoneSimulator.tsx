"use client";

/**
 * PhoneSimulator — Mobil app'in 4 sekmesini birebir simüle eder.
 * Gerçek SVG ikonları (lucide-react), dinamik logo (Chat/Home/Messages/Profile),
 * mobile renk paleti ile birebir.
 */
import { useEffect, useRef, useState } from 'react';
import {
  Search, Bell, Users, Radio, Home as HomeIcon, MessageCircle, User as UserIcon,
  Plus, MoreHorizontal, PenLine, Settings, ChevronRight, Edit3, Mic2,
  Volume2,
} from 'lucide-react';

type Tab = 'discover' | 'rooms' | 'messages' | 'profile';

const TABS: {
  id: Tab;
  label: string;
  accent: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number; style?: React.CSSProperties }>;
  logoPart: string;
}[] = [
  { id: 'discover', label: 'Keşfet',   accent: '#14B8A6', Icon: Radio,         logoPart: 'Chat' },
  { id: 'rooms',    label: 'Odalarım', accent: '#3B82F6', Icon: HomeIcon,      logoPart: 'Home' },
  { id: 'messages', label: 'Mesajlar', accent: '#8B5CF6', Icon: MessageCircle, logoPart: 'Messages' },
  { id: 'profile',  label: 'Profil',   accent: '#F59E0B', Icon: UserIcon,      logoPart: 'Profile' },
];

const ROTATION_MS = 4500;
const SCREEN_BG = '#0F1929';
const BAR_GRADIENT_TOP = '#2A3A58';
const BAR_GRADIENT_MID = '#243250';
const BAR_GRADIENT_BOTTOM = '#1A2540';
const INACTIVE = '#B0BDCC';

function lighten(hex: string, pct: number) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + pct);
  const g = Math.min(255, ((num >> 8) & 0xff) + pct);
  const b = Math.min(255, (num & 0xff) + pct);
  return `rgb(${r},${g},${b})`;
}
function darken(hex: string, pct: number) { return lighten(hex, -pct); }

export default function PhoneSimulator() {
  const [tab, setTab] = useState<Tab>('discover');
  const [autoRotate, setAutoRotate] = useState(true);
  const idxRef = useRef(0);

  useEffect(() => {
    if (!autoRotate) return;
    const t = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % TABS.length;
      setTab(TABS[idxRef.current].id);
    }, ROTATION_MS);
    return () => clearInterval(t);
  }, [autoRotate]);

  const handleTabClick = (id: Tab) => {
    idxRef.current = TABS.findIndex(t => t.id === id);
    setTab(id);
    setAutoRotate(false);
  };

  const currentLogoPart = TABS.find(t => t.id === tab)?.logoPart || 'Chat';

  return (
    <div
      className="bg-black rounded-[2.2rem] p-1.5 border border-slate-700"
      style={{ boxShadow: '0 30px 80px rgba(78, 176, 168, 0.18), 0 0 60px rgba(123, 159, 239, 0.08)' }}
    >
      <div
        className="rounded-[1.7rem] overflow-hidden relative w-[280px] h-[560px]"
        style={{ background: SCREEN_BG }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-b-2xl z-30" />
        {/* Status bar */}
        <div className="absolute top-1 left-0 right-0 flex justify-between px-4 text-[9px] text-white/70 z-30">
          <span>22:48</span>
          <span>•••</span>
        </div>

        <div className="absolute inset-0 pb-[78px]">
          <div className="absolute inset-0" key={tab}>
            {tab === 'discover' && <DiscoverScreen logoPart={currentLogoPart} />}
            {tab === 'rooms' && <MyRoomsScreen logoPart={currentLogoPart} />}
            {tab === 'messages' && <MessagesScreen logoPart={currentLogoPart} />}
            {tab === 'profile' && <ProfileScreen logoPart={currentLogoPart} />}
          </div>
        </div>

        {/* Tab bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div
            style={{
              height: 1.5,
              background: 'linear-gradient(90deg, transparent 0%, rgba(20,184,166,0.55) 25%, rgba(20,184,166,0.55) 75%, transparent 100%)',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}
          />
          <div
            className="relative flex items-end h-[60px] px-1 pb-1.5"
            style={{
              background: `linear-gradient(180deg, ${BAR_GRADIENT_TOP} 0%, ${BAR_GRADIENT_MID} 50%, ${BAR_GRADIENT_BOTTOM} 100%)`,
              boxShadow: '0 -6px 20px rgba(0,0,0,0.4)',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.08), transparent 50%)' }}
            />
            {TABS.map(t => {
              const active = tab === t.id;
              const Icon = t.Icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTabClick(t.id)}
                  className="relative flex-1 h-full flex flex-col items-center justify-end pb-1"
                >
                  {active ? (
                    <div
                      className="absolute"
                      style={{
                        top: 1,
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        overflow: 'hidden',
                        border: '2px solid rgba(255,255,255,0.12)',
                        background: `linear-gradient(135deg, ${lighten(t.accent, 25)}, ${t.accent}, ${darken(t.accent, 35)})`,
                        boxShadow: '0 0 10px rgba(0,0,0,0.35)',
                        transform: 'translateY(-2px)',
                      }}
                    >
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))' }}
                      >
                        <Icon size={22} color="#FFF" strokeWidth={2.4} />
                      </div>
                      <div
                        className="absolute pointer-events-none"
                        style={{
                          top: 0, left: 0, right: 0,
                          height: '55%',
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 60%, transparent 100%)',
                          borderTopLeftRadius: 22,
                          borderTopRightRadius: 22,
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <Icon
                        size={20}
                        color={INACTIVE}
                        strokeWidth={2.2}
                        style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))', marginBottom: 2 }}
                      />
                      <span
                        className="text-[8px] font-bold"
                        style={{ color: INACTIVE, letterSpacing: 0.2, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                      >
                        {t.label}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
          <div
            style={{
              height: 1.5,
              background: 'linear-gradient(90deg, transparent 0%, rgba(20,184,166,0.4) 25%, rgba(20,184,166,0.4) 75%, transparent 100%)',
              marginTop: -1,
            }}
          />
        </div>

        {autoRotate && (
          <div className="absolute top-1.5 right-2 z-40 flex items-center gap-1 text-[8px] text-emerald-400">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            DEMO
          </div>
        )}
      </div>
    </div>
  );
}

/* ────── Glassmorphic header ────── */
function GlassHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(48,65,94,0.92) 0%, rgba(26,40,64,0.82) 55%, rgba(12,22,40,0.6) 100%)',
        }}
      />
      <div className="relative px-3 pt-7 pb-2">{children}</div>
      <div
        style={{
          height: 1.5,
          background: 'linear-gradient(90deg, transparent 0%, rgba(20,184,166,0.55) 25%, rgba(20,184,166,0.55) 75%, transparent 100%)',
        }}
      />
    </div>
  );
}

function HeaderIconBtn({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}
    >
      {children}
    </div>
  );
}

/* Dinamik logo — Soprano + tab'a göre 2. parça */
function HeaderLogo({ part = 'Chat' }: { part?: string }) {
  return (
    <div className="sc-logo" style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'baseline' }}>
      <span className="sc-logo-soprano" style={{ fontSize: 14, lineHeight: 1 }}>Soprano</span>
      <span className="sc-logo-chat" style={{ fontSize: 14, lineHeight: 1, marginLeft: 1 }}>{part}</span>
    </div>
  );
}

/* ────── EKRAN 1: Keşfet ────── */
function DiscoverScreen({ logoPart }: { logoPart: string }) {
  const filters = [
    { id: 'all',   label: 'Tümü',   accent: '#14B8A6', active: true  },
    { id: 'chat',  label: 'Sohbet', accent: '#3B82F6', active: false },
    { id: 'music', label: 'Müzik',  accent: '#8B5CF6', active: false },
    { id: 'game',  label: 'Oyun',   accent: '#EF4444', active: false },
    { id: 'tech',  label: 'Teknik', accent: '#06B6D4', active: false },
  ];
  const rooms = [
    { name: 'Müzik & Sohbet',  desc: 'Akustik gece',       host: 'Aranan', initial: 'A', listeners: 24, isLive: true,  accent: '#8B5CF6', tags: ['rock', 'akustik'] },
    { name: 'Gece Kuşları',    desc: 'Geç saatler için',   host: 'Murat',  initial: 'M', listeners: 17, isLive: true,  accent: '#3B82F6', tags: ['felsefe'] },
    { name: 'Yazılım Kahvesi', desc: 'Bug yakalama saati', host: 'Selin',  initial: 'S', listeners:  8, isLive: false, accent: '#06B6D4', tags: [] },
  ];
  return (
    <div className="h-full flex flex-col">
      <GlassHeader>
        <div className="flex items-center justify-between">
          <HeaderLogo part={logoPart} />
          <div className="flex items-center gap-1">
            <HeaderIconBtn><Search size={13} color="#F1F5F9" strokeWidth={2.2} /></HeaderIconBtn>
            <HeaderIconBtn><Bell size={13} color="#F1F5F9" strokeWidth={2.2} /></HeaderIconBtn>
            <HeaderIconBtn><Users size={13} color="#F1F5F9" strokeWidth={2.2} /></HeaderIconBtn>
          </div>
        </div>
      </GlassHeader>

      <div className="flex-1 overflow-hidden px-2.5 pt-2">
        {/* Welcome */}
        <div
          className="rounded-2xl px-3 py-2 mb-2 border"
          style={{
            background: 'linear-gradient(135deg, rgba(48,65,94,0.5), rgba(20,184,166,0.08))',
            borderColor: 'rgba(20,184,166,0.18)',
          }}
        >
          <div className="text-[8px] text-cyan-300/80 font-semibold tracking-wider">İYİ AKŞAMLAR</div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[11px] font-extrabold text-slate-100">Murat 👋</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-amber-300 font-mono">12.480</span>
              <span className="text-[7px] text-amber-200/60 tracking-wider font-bold">SP</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {filters.map(f => (
            <span
              key={f.id}
              className="shrink-0 px-2.5 py-1 rounded-full text-[8px] font-bold flex items-center gap-1"
              style={{
                background: f.active ? f.accent : 'rgba(255,255,255,0.05)',
                border: f.active ? `1px solid ${f.accent}` : '1px solid rgba(255,255,255,0.08)',
                color: f.active ? '#FFF' : '#94A3B8',
                boxShadow: f.active ? `0 0 6px ${f.accent}66` : 'none',
              }}
            >
              {f.label}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between px-1 mb-1.5">
          <span className="text-[9px] font-bold tracking-wider" style={{ color: '#5EEAD4' }}>TÜM ODALAR</span>
          <ChevronRight size={10} color="#64748B" />
        </div>

        <div className="space-y-1.5">
          {rooms.map((r, i) => (
            <div
              key={i}
              className="rounded-2xl p-2 relative overflow-hidden"
              style={{
                background: '#1a2030',
                border: '1px solid rgba(20,184,166,0.20)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.35)',
                minHeight: 70,
              }}
            >
              <div className="flex items-center gap-1 mb-1.5">
                {r.isLive ? (
                  <div
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                    style={{ background: 'rgba(239,68,68,0.9)' }}
                  >
                    <span className="w-1 h-1 bg-white rounded-full" />
                    <span className="text-[7px] font-extrabold text-white tracking-wider">CANLI · {r.listeners}</span>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                    style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
                  >
                    <Mic2 size={7} color="#F59E0B" strokeWidth={2.5} />
                    <span className="text-[7px] font-bold text-amber-400">Uyuyor</span>
                  </div>
                )}
              </div>
              <div className="relative z-10">
                <div className="text-[11px] font-extrabold text-slate-100 leading-tight" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                  {r.name}
                </div>
                <div className="text-[8px] text-white/65 mt-0.5">{r.desc}</div>
                {r.tags.length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {r.tags.map(t => (
                      <span
                        key={t}
                        className="px-1 py-0 rounded-md text-[7px] font-bold tracking-wider"
                        style={{ background: 'rgba(20,184,166,0.18)', border: '0.5px solid rgba(20,184,166,0.35)', color: '#5EEAD4' }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${r.accent}, ${r.accent}88)`, border: '1px solid rgba(255,255,255,0.3)' }}
                  >
                    {r.initial}
                  </div>
                  <span className="text-[8px] font-semibold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>
                    {r.host}
                  </span>
                  {r.listeners > 0 && (
                    <div
                      className="ml-auto flex items-center gap-0.5 px-1 py-0 rounded-md"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                      <Users size={7} color="rgba(255,255,255,0.6)" strokeWidth={2.5} />
                      <span className="text-[7px] font-bold text-white/60">{r.listeners}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────── EKRAN 2: Odalarım — ekran görseline göre ────── */
function MyRoomsScreen({ logoPart }: { logoPart: string }) {
  return (
    <div className="h-full flex flex-col">
      <GlassHeader>
        <div className="flex items-center justify-between">
          <HeaderLogo part={logoPart} />
          <div className="flex items-center gap-1">
            <HeaderIconBtn><Search size={13} color="#F1F5F9" strokeWidth={2.2} /></HeaderIconBtn>
            <HeaderIconBtn><Bell size={13} color="#F1F5F9" strokeWidth={2.2} /></HeaderIconBtn>
            <HeaderIconBtn><Users size={13} color="#F1F5F9" strokeWidth={2.2} /></HeaderIconBtn>
          </div>
        </div>
      </GlassHeader>

      <div className="flex-1 overflow-hidden px-2.5 pt-2">
        {/* Yeni Oda Oluştur CTA */}
        <div
          className="rounded-2xl p-2.5 mb-2 flex items-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
            boxShadow: '0 6px 18px rgba(20,184,166,0.4)',
          }}
        >
          <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
            <Plus size={14} color="#FFF" strokeWidth={3} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-extrabold text-white">Yeni Oda Oluştur</div>
            <div className="text-[8px] text-white/80">Sesli veya görüntülü oda aç</div>
          </div>
          <ChevronRight size={14} color="#FFF" />
        </div>

        {/* Stat row */}
        <div
          className="rounded-xl mb-2 p-2 flex items-center justify-around"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {[
            { icon: <HomeIcon size={11} color="#10b981" strokeWidth={2.5} />, val: '1', label: 'Oda',       color: '#10b981' },
            { icon: <Radio size={11} color="#ef4444" strokeWidth={2.5} />,    val: '0', label: 'Canlı',     color: '#ef4444' },
            { icon: <Users size={11} color="#22c55e" strokeWidth={2.5} />,    val: '0', label: 'Dinleyici', color: '#22c55e' },
            { icon: <span className="text-[9px]">💎</span>,                    val: '5.2k', label: 'SP/Hafta', color: '#a855f7' },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center" style={{ minWidth: 0 }}>
              <div className="flex items-center gap-0.5">
                {s.icon}
                <span className="text-[10px] font-bold" style={{ color: s.color }}>{s.val}</span>
              </div>
              <span className="text-[7px] text-slate-500 mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Section: Arkadaşların Canlı */}
        <div className="flex items-center gap-1 mb-1 px-1">
          <span className="w-0.5 h-3 rounded-full" style={{ background: '#22c55e' }} />
          <Users size={9} color="#22c55e" strokeWidth={2.5} />
          <span className="text-[9px] font-bold text-slate-200">Arkadaşların Canlı</span>
        </div>
        <div
          className="rounded-xl mb-2 p-2 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="text-[9px] text-slate-300">👥 Arkadaşların şu an bir odada değil.</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Takip ettiğin kişiler odaya girdiğinde burada görünür!</div>
        </div>

        {/* Section: Pasif Kalıcı Odalar */}
        <div className="flex items-center justify-between mb-1 px-1">
          <div className="flex items-center gap-1">
            <span className="w-0.5 h-3 rounded-full" style={{ background: '#a855f7' }} />
            <span className="text-[9px]">🌙</span>
            <span className="text-[9px] font-bold text-slate-200">Pasif Kalıcı Odalar</span>
          </div>
          <span className="text-[7px] text-slate-500">1</span>
        </div>
        <div
          className="rounded-xl mb-2 p-2"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(245,158,11,0.35)',
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 border border-amber-400/50">
              B
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-extrabold text-slate-100">Burak&apos;ın Odası</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[7px] px-1 py-0 rounded bg-violet-500/20 border border-violet-500/40 text-violet-300 font-bold">🌙 Pasif</span>
                <span className="text-[7px] px-1 py-0 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">⚡ Premium</span>
              </div>
            </div>
            <button
              type="button"
              className="px-2 py-1 rounded-md text-[8px] font-extrabold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}
            >
              ⚡ Aktifleştir
            </button>
          </div>
        </div>

        {/* Section: Son Girdiğin Odalar */}
        <div className="flex items-center gap-1 mb-1 px-1">
          <span className="w-0.5 h-3 rounded-full" style={{ background: '#3b82f6' }} />
          <span className="text-[9px]">⏱</span>
          <span className="text-[9px] font-bold text-slate-200">Son Girdiğin Odalar</span>
        </div>
        <div
          className="rounded-xl p-2 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="text-[9px] text-slate-300">📻 Şu an canlı oda yok.</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Daha önce girdiğin odalar canlı olduğunda burada görünür!</div>
        </div>
      </div>
    </div>
  );
}

/* ────── EKRAN 3: Mesajlar ────── */
function MessagesScreen({ logoPart }: { logoPart: string }) {
  const dms = [
    { name: 'Aranan',      msg: 'Hadi bağlanıyorum...',    time: '22:46', unread: 2, color: '#8B5CF6' },
    { name: 'Murat Berxo', msg: 'Tamam, oraya geliyorum.', time: '22:31', unread: 0, color: '#06B6D4' },
    { name: 'Selin K.',    msg: '🎵 Sesli mesaj',           time: '21:10', unread: 1, color: '#EC4899' },
    { name: 'ERDAR',       msg: 'Yarın açar mısın odayı?', time: 'dün',   unread: 0, color: '#F59E0B' },
    { name: 'Eren D.',     msg: 'Tabii, görüşürüz!',       time: 'dün',   unread: 0, color: '#10B981' },
  ];
  return (
    <div className="h-full flex flex-col">
      <GlassHeader>
        <div className="flex items-center justify-between">
          <HeaderLogo part={logoPart} />
          <div className="flex items-center gap-1">
            <HeaderIconBtn><Search size={13} color="#F1F5F9" strokeWidth={2.2} /></HeaderIconBtn>
            <HeaderIconBtn><Bell size={13} color="#F1F5F9" strokeWidth={2.2} /></HeaderIconBtn>
            <HeaderIconBtn><Edit3 size={13} color="#F1F5F9" strokeWidth={2.2} /></HeaderIconBtn>
          </div>
        </div>
      </GlassHeader>

      <div className="flex-1 overflow-hidden px-2 pt-2">
        <div className="space-y-0.5">
          {dms.map((m, i) => (
            <div key={i} className="flex items-center gap-2 px-1 py-1.5 rounded-lg hover:bg-white/5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                style={{ background: `linear-gradient(135deg, ${m.color}, ${m.color}88)` }}
              >
                {m.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-semibold text-slate-100 truncate">{m.name}</span>
                  <span className="text-[7px] text-slate-500 shrink-0">{m.time}</span>
                </div>
                <div className={`text-[9px] truncate ${m.unread > 0 ? 'text-slate-200' : 'text-slate-500'}`}>{m.msg}</div>
              </div>
              {m.unread > 0 && (
                <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[8px] font-bold text-[#0A0F1A] shrink-0">
                  {m.unread}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────── EKRAN 4: Profil ────── */
function ProfileScreen({ logoPart }: { logoPart: string }) {
  return (
    <div className="h-full flex flex-col">
      <GlassHeader>
        <div className="flex items-center justify-between">
          <HeaderLogo part={logoPart} />
          <div className="flex items-center gap-1">
            <HeaderIconBtn><PenLine size={13} color="#F1F5F9" strokeWidth={2.2} /></HeaderIconBtn>
            <HeaderIconBtn><Settings size={13} color="#F1F5F9" strokeWidth={2.2} /></HeaderIconBtn>
          </div>
        </div>
      </GlassHeader>

      <div className="flex-1 overflow-hidden px-2.5 pt-2">
        <div className="flex flex-col items-center mb-2">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-full p-0.5"
              style={{ background: 'conic-gradient(from 0deg, #f59e0b, #ec4899, #8b5cf6, #06b6d4, #f59e0b)' }}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-lg font-bold text-white">M</div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2" style={{ borderColor: SCREEN_BG }} />
          </div>
          <div className="mt-1.5 flex items-center gap-1">
            <span className="text-[12px] font-bold text-slate-100">Murat Berxo</span>
            <span className="text-cyan-400 text-[11px]">✓</span>
          </div>
          <span className="text-[8px] text-slate-500">@muratb</span>
          <div className="mt-1 flex items-center gap-1">
            <span className="text-[8px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold tracking-wider">👑 PRO</span>
            <span className="text-[8px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono">12.480 SP</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 mb-1.5 text-center">
          <div className="rounded-md bg-white/5 border border-white/10 px-1 py-1">
            <div className="text-[10px] font-bold text-slate-100">142</div>
            <div className="text-[7px] text-slate-500">Takipçi</div>
          </div>
          <div className="rounded-md bg-white/5 border border-white/10 px-1 py-1">
            <div className="text-[10px] font-bold text-slate-100">87</div>
            <div className="text-[7px] text-slate-500">Takip</div>
          </div>
          <div className="rounded-md bg-white/5 border border-white/10 px-1 py-1">
            <div className="text-[10px] font-bold text-slate-100">23</div>
            <div className="text-[7px] text-slate-500">Oda</div>
          </div>
        </div>

        <div className="rounded-lg bg-white/5 border border-white/10 p-2 mb-1.5">
          <div className="text-[7px] font-bold text-slate-500 tracking-wider mb-0.5">VOICE BIO</div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Volume2 size={9} color="#f59e0b" strokeWidth={2.5} />
            </div>
            <div className="flex-1 flex items-center gap-0.5">
              {[3, 5, 7, 4, 6, 8, 5, 3, 6, 7, 4, 5, 8, 6, 4].map((h, i) => (
                <span key={i} className="w-0.5 rounded-full bg-amber-300" style={{ height: `${h}px` }} />
              ))}
            </div>
            <span className="text-[7px] text-slate-400">0:18</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 text-[7px]">
          <div className="rounded-md bg-white/5 border border-white/10 p-1.5">
            <div className="text-slate-500 tracking-wider mb-0.5">DİL</div>
            <div className="text-slate-200">🇹🇷 TR · 🇬🇧 EN</div>
          </div>
          <div className="rounded-md bg-white/5 border border-white/10 p-1.5">
            <div className="text-slate-500 tracking-wider mb-0.5">İLGİ</div>
            <div className="text-slate-200">🎵 🎮 ☕</div>
          </div>
        </div>
      </div>
    </div>
  );
}
