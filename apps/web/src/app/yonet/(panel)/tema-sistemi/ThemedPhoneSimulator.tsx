"use client";

/**
 * ThemedPhoneSimulator — Ana sayfadaki PhoneSimulator'ın tema renklerine
 * bağlı versiyonu. Aynı 4 tab (Keşfet/Odalarım/Mesajlar/Profil) auto-rotate,
 * SCREEN_BG ve diğer renkler theme config'ten gelir.
 */
import { useEffect, useRef, useState } from 'react';
import { Radio, Home as HomeIcon, MessageCircle, User as UserIcon, Plus, ChevronRight, Mic2 } from 'lucide-react';

interface ThemeColors {
  color_primary: string; color_primary_hover: string; color_secondary: string; color_accent: string;
  color_success: string; color_warning: string; color_danger: string; color_info: string;
  surface_bg: string; surface_card: string; surface_elevated: string; surface_modal: string;
  surface_border: string; surface_divider: string;
  text_primary: string; text_secondary: string; text_tertiary: string; text_link: string; text_muted: string;
  gradient_brand_from: string; gradient_brand_to: string; gradient_brand_angle: number;
  gradient_premium_from: string; gradient_premium_to: string;
  radius_sm: number; radius_md: number; radius_lg: number; radius_xl: number; radius_pill: number;
}

type Tab = 'discover' | 'rooms' | 'messages' | 'profile';

const ROTATION_MS = 4500;

function lighten(hex: string, pct: number): string {
  if (!hex?.startsWith('#') || hex.length !== 7) return hex;
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + pct);
  const g = Math.min(255, ((num >> 8) & 0xff) + pct);
  const b = Math.min(255, (num & 0xff) + pct);
  return `rgb(${r},${g},${b})`;
}
function darken(hex: string, pct: number) { return lighten(hex, -pct); }

export default function ThemedPhoneSimulator({ themeColors: t }: { themeColors: ThemeColors }) {
  const tabs = [
    { id: 'discover' as Tab, label: 'Keşfet',   accent: t.color_primary,   Icon: Radio },
    { id: 'rooms' as Tab,    label: 'Odalarım', accent: t.color_info,      Icon: HomeIcon },
    { id: 'messages' as Tab, label: 'Mesajlar', accent: t.color_secondary, Icon: MessageCircle },
    { id: 'profile' as Tab,  label: 'Profil',   accent: t.color_accent,    Icon: UserIcon },
  ];

  const [tab, setTab] = useState<Tab>('discover');
  const [autoRotate, setAutoRotate] = useState(true);
  const idxRef = useRef(0);

  useEffect(() => {
    if (!autoRotate) return;
    const i = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % tabs.length;
      setTab(tabs[idxRef.current].id);
    }, ROTATION_MS);
    return () => clearInterval(i);
  }, [autoRotate, tabs.length]);

  return (
    <div className="rounded-[2.2rem] p-1.5 border" style={{ background: '#000', borderColor: t.surface_border }}>
      <div className="rounded-[1.7rem] overflow-hidden relative w-[260px] h-[520px]" style={{ background: t.surface_bg }}>
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-b-2xl z-30" />
        {/* Status bar */}
        <div className="absolute top-0.5 left-0 right-0 flex justify-between px-3 text-[9px] z-30" style={{ color: t.text_tertiary }}>
          <span>22:48</span>
          <span style={{ color: t.text_secondary }}>•••</span>
        </div>

        {/* Screen content */}
        <div className="absolute inset-0 pb-[72px] pt-5">
          {tab === 'discover' && <DiscoverScreen t={t} />}
          {tab === 'rooms' && <RoomsScreen t={t} />}
          {tab === 'messages' && <MessagesScreen t={t} />}
          {tab === 'profile' && <ProfileScreen t={t} />}
        </div>

        {/* Tab bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div style={{
            height: 1.5,
            background: `linear-gradient(90deg, transparent 0%, ${t.color_primary}88 25%, ${t.color_primary}88 75%, transparent 100%)`,
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
          }} />
          <div className="relative flex items-end h-[56px] px-1 pb-1.5"
            style={{
              background: `linear-gradient(180deg, ${lighten(t.surface_elevated, 20)} 0%, ${t.surface_elevated} 50%, ${darken(t.surface_bg, 5)} 100%)`,
              boxShadow: '0 -4px 12px rgba(0,0,0,0.4)',
            }}>
            {tabs.map(tt => {
              const active = tab === tt.id;
              const Icon = tt.Icon;
              return (
                <button key={tt.id} type="button"
                  onClick={() => {
                    idxRef.current = tabs.findIndex(x => x.id === tt.id);
                    setTab(tt.id);
                    setAutoRotate(false);
                  }}
                  className="relative flex-1 h-full flex flex-col items-center justify-end pb-1"
                  aria-label={tt.label}>
                  {active ? (
                    <div className="absolute" style={{
                      top: 0, width: 40, height: 40, borderRadius: 20, overflow: 'hidden',
                      border: '2px solid rgba(255,255,255,0.12)',
                      background: `linear-gradient(135deg, ${lighten(tt.accent, 25)}, ${tt.accent}, ${darken(tt.accent, 35)})`,
                      boxShadow: '0 0 10px rgba(0,0,0,0.35)',
                      transform: 'translateY(-2px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={20} color="#FFF" strokeWidth={2.4} />
                    </div>
                  ) : (
                    <>
                      <Icon size={18} color={t.text_tertiary} strokeWidth={2.2}
                        style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))', marginBottom: 2 }} />
                      <span className="text-[8px] font-bold"
                        style={{ color: t.text_tertiary, letterSpacing: 0.2 }}>{tt.label}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {autoRotate && (
          <div className="absolute top-1 right-2 z-40 flex items-center gap-1 text-[8px]" style={{ color: t.color_success }}>
            <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: t.color_success }} />
            DEMO
          </div>
        )}
      </div>
    </div>
  );
}

/* ────── Discover (Keşfet) ────── */
function DiscoverScreen({ t }: { t: ThemeColors }) {
  return (
    <div className="px-3 py-2 space-y-2.5">
      <div className="flex items-center justify-between">
        <div style={{ color: t.text_primary, fontSize: 18, fontWeight: 800 }}>SopranoChat</div>
        <Plus size={18} color={t.color_primary} />
      </div>
      <input type="text" placeholder="Ara..."
        className="w-full px-2.5 py-1.5 text-xs outline-none"
        style={{ background: t.surface_card, color: t.text_primary, borderRadius: t.radius_pill, border: `1px solid ${t.surface_border}` }} />
      <div className="text-[10px] uppercase tracking-wider" style={{ color: t.text_tertiary }}>Canlı Odalar</div>
      {[
        { title: '🎵 Müzik Sohbet', count: 24, host: 'Murat' },
        { title: '📚 Felsefe Gecesi', count: 12, host: 'Selin' },
        { title: '🎬 Film Kulübü', count: 8, host: 'Ahmet' },
      ].map((r, i) => (
        <div key={i} className="rounded-lg p-2 flex items-center gap-2"
          style={{ background: t.surface_card, border: `1px solid ${t.surface_border}`, borderRadius: t.radius_md }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
            style={{ background: `linear-gradient(${t.gradient_brand_angle}deg, ${t.gradient_brand_from}, ${t.gradient_brand_to})` }}>🎙</div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold truncate" style={{ color: t.text_primary }}>{r.title}</div>
            <div className="text-[9px]" style={{ color: t.text_tertiary }}>{r.host} · {r.count} dinleyici</div>
          </div>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: t.color_danger }} />
        </div>
      ))}
    </div>
  );
}

/* ────── Odalarım ────── */
function RoomsScreen({ t }: { t: ThemeColors }) {
  return (
    <div className="px-3 py-2 space-y-2">
      <div style={{ color: t.text_primary, fontSize: 16, fontWeight: 800 }}>Odalarım</div>
      <button type="button" className="w-full py-2 text-xs font-bold flex items-center justify-center gap-1.5"
        style={{ background: `linear-gradient(${t.gradient_brand_angle}deg, ${t.gradient_brand_from}, ${t.gradient_brand_to})`, color: '#FFF', borderRadius: t.radius_md }}>
        <Plus size={14} /> Yeni Oda Aç
      </button>
      {['Felsefe Gecesi', 'Müzik Sohbet', 'Kitap Kulübü'].map((name, i) => (
        <div key={i} className="rounded-lg p-2 flex items-center gap-2"
          style={{ background: t.surface_card, border: `1px solid ${t.surface_border}`, borderRadius: t.radius_md }}>
          <Mic2 size={16} color={t.color_primary} />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold" style={{ color: t.text_primary }}>{name}</div>
            <div className="text-[9px]" style={{ color: t.text_tertiary }}>3 saat önce</div>
          </div>
          <ChevronRight size={14} color={t.text_tertiary} />
        </div>
      ))}
    </div>
  );
}

/* ────── Mesajlar ────── */
function MessagesScreen({ t }: { t: ThemeColors }) {
  return (
    <div className="px-3 py-2 space-y-2">
      <div style={{ color: t.text_primary, fontSize: 16, fontWeight: 800 }}>Mesajlar</div>
      <input type="text" placeholder="Sohbet ara..."
        className="w-full px-2.5 py-1.5 text-xs outline-none"
        style={{ background: t.surface_card, color: t.text_primary, borderRadius: t.radius_pill, border: `1px solid ${t.surface_border}` }} />
      {[
        { n: 'Ahmet', msg: 'Selam nasılsın?', t: '14:32', u: 2 },
        { n: 'Selin', msg: 'Bu akşam görüşelim mi', t: '12:15', u: 0 },
        { n: 'Kemal', msg: 'Görüşürüz 👋', t: 'Dün',  u: 0 },
      ].map((m, i) => (
        <div key={i} className="flex items-center gap-2 py-1.5">
          <div className="w-8 h-8 rounded-full"
            style={{ background: `linear-gradient(${t.gradient_brand_angle}deg, ${t.color_secondary}, ${t.color_primary})` }} />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold" style={{ color: t.text_primary }}>{m.n}</div>
            <div className="text-[9px] truncate" style={{ color: t.text_secondary }}>{m.msg}</div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <div className="text-[9px]" style={{ color: t.text_tertiary }}>{m.t}</div>
            {m.u > 0 && (
              <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                style={{ background: t.color_danger, color: '#FFF', fontSize: 7, fontWeight: 800 }}>{m.u}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────── Profil ────── */
function ProfileScreen({ t }: { t: ThemeColors }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 space-y-2">
      <div className="w-16 h-16 rounded-full"
        style={{ background: `linear-gradient(${t.gradient_brand_angle}deg, ${t.gradient_brand_from}, ${t.gradient_brand_to})` }} />
      <div style={{ color: t.text_primary, fontSize: 14, fontWeight: 800 }}>Murat Berxo</div>
      <div style={{ color: t.text_tertiary, fontSize: 10 }}>@muratb</div>
      <div className="px-2.5 py-1 rounded-full"
        style={{ background: `linear-gradient(135deg, ${t.gradient_premium_from}, ${t.gradient_premium_to})`, color: '#0F172A', fontSize: 9, fontWeight: 800 }}>
        PRO
      </div>
      <div className="grid grid-cols-3 gap-1.5 w-full mt-1">
        {[{ n: 248, l: 'Takipçi', c: t.color_primary }, { n: 142, l: 'Takip', c: t.color_info }, { n: 12, l: 'Oda', c: t.color_accent }].map((s, i) => (
          <div key={i} className="p-1.5 text-center"
            style={{ background: t.surface_card, borderRadius: t.radius_md, border: `1px solid ${t.surface_border}` }}>
            <div style={{ color: s.c, fontSize: 14, fontWeight: 800 }}>{s.n}</div>
            <div style={{ color: t.text_tertiary, fontSize: 8 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <button type="button" className="w-full py-1.5 text-xs font-bold mt-1"
        style={{ background: `linear-gradient(${t.gradient_brand_angle}deg, ${t.gradient_brand_from}, ${t.gradient_brand_to})`, color: '#FFF', borderRadius: t.radius_md }}>
        Profili Düzenle
      </button>
    </div>
  );
}
