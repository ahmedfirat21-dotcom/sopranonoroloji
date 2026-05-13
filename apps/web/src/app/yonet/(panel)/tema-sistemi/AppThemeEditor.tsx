"use client";

/**
 * AppThemeEditor — Uygulama tema sistemi yönetimi (çoklu sekme).
 * Sekmeler: Genel Palet / Oda Düzeni / Profil / Mesajlar / Keşfet / Login / Animasyon / Tipografi
 * Sağda: PhoneSimulator (tema renkleriyle canlı önizleme)
 */
import React, { useReducer, useTransition } from 'react';
import { Save, RotateCcw, Loader2, Palette, Home as HomeIcon, User as UserIcon, MessageCircle, Radio, LogIn, Activity, Type } from 'lucide-react';
import { saveAppTheme } from './actions';
import ThemedPhoneSimulator from './ThemedPhoneSimulator';
import RoomLayoutEditor from '../oda-duzeni/RoomLayoutEditor';

type Tab = 'palet' | 'oda-duzeni' | 'profil' | 'mesajlar' | 'kesfet' | 'login' | 'anim' | 'tipografi';

interface ThemeConfig {
  color_primary: string; color_primary_hover: string; color_secondary: string; color_accent: string;
  color_success: string; color_warning: string; color_danger: string; color_info: string;
  surface_bg: string; surface_card: string; surface_elevated: string;
  surface_overlay: string; surface_modal: string; surface_border: string; surface_divider: string;
  text_primary: string; text_secondary: string; text_tertiary: string;
  text_inverse: string; text_link: string; text_muted: string;
  gradient_brand_from: string; gradient_brand_to: string; gradient_brand_angle: number;
  gradient_premium_from: string; gradient_premium_to: string;
  radius_sm: number; radius_md: number; radius_lg: number; radius_xl: number; radius_pill: number;
  mode: 'dark' | 'light' | 'auto'; description: string;
  // ★ v120 sayfa-bazlı ek alanlar
  profile_avatar_size?: number;
  profile_show_premium_badge?: boolean;
  profile_stat_card_radius?: number;
  profile_hero_gradient_overlay?: boolean;
  messages_bubble_radius?: number;
  messages_my_color?: string;
  messages_their_color?: string;
  messages_show_online_dot?: boolean;
  discover_card_radius?: number;
  discover_card_shadow?: boolean;
  discover_grid_columns?: number;
  login_bg_gradient_from?: string;
  login_bg_gradient_to?: string;
  login_logo_size?: number;
  login_button_radius?: number;
  anim_page_transition?: 'fade' | 'slide' | 'none';
  anim_modal_open_ms?: number;
  anim_button_press_scale?: number;
  anim_reduce_motion?: boolean;
  typography_font_family?: 'system' | 'inter' | 'rounded';
  typography_base_size?: number;
  typography_heading_weight?: string;
  typography_letter_spacing?: number;
  typography_line_height?: number;
}

const DEFAULT_CFG: ThemeConfig = {
  color_primary: '#14B8A6', color_primary_hover: '#0D9488', color_secondary: '#A78BFA', color_accent: '#FBBF24',
  color_success: '#10B981', color_warning: '#F59E0B', color_danger: '#EF4444', color_info: '#3B82F6',
  surface_bg: '#0A0F1A', surface_card: '#0F1926', surface_elevated: '#1E293B',
  surface_overlay: 'rgba(15,25,38,0.85)', surface_modal: '#0F1926',
  surface_border: 'rgba(255,255,255,0.08)', surface_divider: 'rgba(255,255,255,0.04)',
  text_primary: '#F1F5F9', text_secondary: '#CBD5E1', text_tertiary: '#94A3B8',
  text_inverse: '#0F172A', text_link: '#22D3EE', text_muted: '#64748B',
  gradient_brand_from: '#14B8A6', gradient_brand_to: '#06B6D4', gradient_brand_angle: 135,
  gradient_premium_from: '#FBBF24', gradient_premium_to: '#F472B6',
  radius_sm: 6, radius_md: 12, radius_lg: 18, radius_xl: 24, radius_pill: 999,
  mode: 'dark', description: '',
  profile_avatar_size: 80,
  profile_show_premium_badge: true,
  profile_stat_card_radius: 12,
  profile_hero_gradient_overlay: true,
  messages_bubble_radius: 16,
  messages_my_color: '#14B8A6',
  messages_their_color: '#1E293B',
  messages_show_online_dot: true,
  discover_card_radius: 14,
  discover_card_shadow: true,
  discover_grid_columns: 2,
  login_bg_gradient_from: '#0F1926',
  login_bg_gradient_to: '#0A0F1A',
  login_logo_size: 80,
  login_button_radius: 12,
  anim_page_transition: 'fade',
  anim_modal_open_ms: 300,
  anim_button_press_scale: 0.96,
  anim_reduce_motion: false,
  typography_font_family: 'system',
  typography_base_size: 14,
  typography_heading_weight: '700',
  typography_letter_spacing: 0,
  typography_line_height: 1.4,
};

function reducer(s: ThemeConfig, p: Partial<ThemeConfig> | { reset: true }): ThemeConfig {
  if ('reset' in p) return DEFAULT_CFG;
  return { ...s, ...p };
}

export default function AppThemeEditor({ initial, roomLayoutInitial }: { initial: any; roomLayoutInitial?: any }) {
  const merged: ThemeConfig = { ...DEFAULT_CFG, ...(initial?.config || {}) };
  const [cfg, dispatch] = useReducer(reducer, merged);
  const [tab, setTab] = React.useState<Tab>('palet');
  const [saving, startSave] = useTransition();
  const [status, setStatus] = React.useState<string | null>(null);

  const upd = (patch: Partial<ThemeConfig>) => dispatch(patch);
  const handleSave = () => {
    setStatus(null);
    startSave(async () => {
      const res = await saveAppTheme(cfg as any);
      setStatus(res.ok ? '✓ Kaydedildi — mobile anında uygular.' : `✗ Hata: ${res.error}`);
      setTimeout(() => setStatus(null), 3500);
    });
  };

  const TABS: { k: Tab; l: string; i: React.ReactNode }[] = [
    { k: 'palet',      l: 'Genel Palet', i: <Palette className="w-3.5 h-3.5" /> },
    { k: 'oda-duzeni', l: 'Oda Düzeni',  i: <HomeIcon className="w-3.5 h-3.5" /> },
    { k: 'profil',     l: 'Profil',      i: <UserIcon className="w-3.5 h-3.5" /> },
    { k: 'mesajlar',   l: 'Mesajlar',    i: <MessageCircle className="w-3.5 h-3.5" /> },
    { k: 'kesfet',     l: 'Keşfet',      i: <Radio className="w-3.5 h-3.5" /> },
    { k: 'login',      l: 'Login',       i: <LogIn className="w-3.5 h-3.5" /> },
    { k: 'anim',       l: 'Animasyon',   i: <Activity className="w-3.5 h-3.5" /> },
    { k: 'tipografi',  l: 'Tipografi',   i: <Type className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-slate-900/50 border border-slate-700/40 rounded-xl p-1 overflow-x-auto sticky top-0 z-10 backdrop-blur">
        {TABS.map(t => (
          <button key={t.k} type="button" onClick={() => setTab(t.k)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              tab === t.k
                ? 'bg-gradient-to-r from-rose-500/30 to-pink-500/20 text-rose-100 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
            }`}>
            {t.i}{t.l}
          </button>
        ))}
      </div>

      {/* Oda Düzeni tab — bağımsız tam genişlik (RoomLayoutEditor kendi layout'u var) */}
      {tab === 'oda-duzeni' && (
        <div>
          <div className="text-xs text-slate-500 mb-3 px-1">
            ★ Oda düzeni ayarları artık tema sisteminin bir parçası. Web admin'de kaydetince mobile anında yansır.
          </div>
          <RoomLayoutEditor initial={roomLayoutInitial} />
        </div>
      )}

      {tab !== 'oda-duzeni' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
          {/* SOL: Ayarlar (tab'a göre) */}
          <div className="space-y-3">
        {tab === 'palet' && (<>
        <Section title="Marka Renkleri">
          <ColorGrid>
            <ColorField label="Primary" value={cfg.color_primary} onChange={v => upd({ color_primary: v })} />
            <ColorField label="Primary Hover" value={cfg.color_primary_hover} onChange={v => upd({ color_primary_hover: v })} />
            <ColorField label="Secondary" value={cfg.color_secondary} onChange={v => upd({ color_secondary: v })} />
            <ColorField label="Accent (Vurgu)" value={cfg.color_accent} onChange={v => upd({ color_accent: v })} />
          </ColorGrid>
        </Section>

        <Section title="Durum Renkleri">
          <ColorGrid>
            <ColorField label="Başarı" value={cfg.color_success} onChange={v => upd({ color_success: v })} />
            <ColorField label="Uyarı" value={cfg.color_warning} onChange={v => upd({ color_warning: v })} />
            <ColorField label="Hata" value={cfg.color_danger} onChange={v => upd({ color_danger: v })} />
            <ColorField label="Bilgi" value={cfg.color_info} onChange={v => upd({ color_info: v })} />
          </ColorGrid>
        </Section>

        <Section title="Yüzey (Arka Plan Katmanları)">
          <ColorGrid>
            <ColorField label="Ana BG" value={cfg.surface_bg} onChange={v => upd({ surface_bg: v })} />
            <ColorField label="Kart" value={cfg.surface_card} onChange={v => upd({ surface_card: v })} />
            <ColorField label="Yükseltilmiş" value={cfg.surface_elevated} onChange={v => upd({ surface_elevated: v })} />
            <ColorField label="Modal" value={cfg.surface_modal} onChange={v => upd({ surface_modal: v })} />
            <ColorField label="Sınır" value={cfg.surface_border} onChange={v => upd({ surface_border: v })} />
            <ColorField label="Ayraç" value={cfg.surface_divider} onChange={v => upd({ surface_divider: v })} />
          </ColorGrid>
        </Section>

        <Section title="Metin Renkleri">
          <ColorGrid>
            <ColorField label="Ana Yazı" value={cfg.text_primary} onChange={v => upd({ text_primary: v })} />
            <ColorField label="İkincil" value={cfg.text_secondary} onChange={v => upd({ text_secondary: v })} />
            <ColorField label="Üçüncül" value={cfg.text_tertiary} onChange={v => upd({ text_tertiary: v })} />
            <ColorField label="Link" value={cfg.text_link} onChange={v => upd({ text_link: v })} />
            <ColorField label="Soluk" value={cfg.text_muted} onChange={v => upd({ text_muted: v })} />
            <ColorField label="Inverse" value={cfg.text_inverse} onChange={v => upd({ text_inverse: v })} />
          </ColorGrid>
        </Section>

        <Section title="Marka Gradienti">
          <ColorGrid>
            <ColorField label="Başlangıç" value={cfg.gradient_brand_from} onChange={v => upd({ gradient_brand_from: v })} />
            <ColorField label="Bitiş" value={cfg.gradient_brand_to} onChange={v => upd({ gradient_brand_to: v })} />
          </ColorGrid>
          <SliderField label="Açı" min={0} max={360} step={5} value={cfg.gradient_brand_angle}
            onChange={v => upd({ gradient_brand_angle: v })} display={`${cfg.gradient_brand_angle}°`} />
        </Section>

        <Section title="Premium Gradient">
          <ColorGrid>
            <ColorField label="Başlangıç" value={cfg.gradient_premium_from} onChange={v => upd({ gradient_premium_from: v })} />
            <ColorField label="Bitiş" value={cfg.gradient_premium_to} onChange={v => upd({ gradient_premium_to: v })} />
          </ColorGrid>
        </Section>

        <Section title="Köşe Yuvarlamaları">
          <SliderField label="Small" min={0} max={16} step={1} value={cfg.radius_sm}
            onChange={v => upd({ radius_sm: v })} display={`${cfg.radius_sm}px`} />
          <SliderField label="Medium" min={4} max={28} step={1} value={cfg.radius_md}
            onChange={v => upd({ radius_md: v })} display={`${cfg.radius_md}px`} />
          <SliderField label="Large" min={8} max={40} step={1} value={cfg.radius_lg}
            onChange={v => upd({ radius_lg: v })} display={`${cfg.radius_lg}px`} />
          <SliderField label="X-Large" min={12} max={60} step={1} value={cfg.radius_xl}
            onChange={v => upd({ radius_xl: v })} display={`${cfg.radius_xl}px`} />
        </Section>
        </>)}

        {/* ★ v120 sayfa-bazlı sekmeler — temel ayar setleri */}
        {tab === 'profil' && (<>
          <Section title="Profil — Avatar & Hero">
            <SliderField label="Avatar Boyutu" min={48} max={160} step={4} value={cfg.profile_avatar_size ?? 80}
              onChange={v => upd({ profile_avatar_size: v })} display={`${cfg.profile_avatar_size ?? 80}px`} />
            <ToggleField label="Premium Rozeti Göster" checked={cfg.profile_show_premium_badge ?? true}
              onChange={v => upd({ profile_show_premium_badge: v })} />
            <ToggleField label="Hero Gradient Overlay" checked={cfg.profile_hero_gradient_overlay ?? true}
              onChange={v => upd({ profile_hero_gradient_overlay: v })} />
          </Section>
          <Section title="Profil — İstatistik Kartları">
            <SliderField label="Kart Köşe Yuvarlaması" min={4} max={28} step={1}
              value={cfg.profile_stat_card_radius ?? 12}
              onChange={v => upd({ profile_stat_card_radius: v })}
              display={`${cfg.profile_stat_card_radius ?? 12}px`} />
          </Section>
        </>)}

        {tab === 'mesajlar' && (<>
          <Section title="Sohbet Baloncuğu">
            <SliderField label="Köşe Yuvarlaması" min={4} max={32} step={1}
              value={cfg.messages_bubble_radius ?? 16}
              onChange={v => upd({ messages_bubble_radius: v })}
              display={`${cfg.messages_bubble_radius ?? 16}px`} />
            <ColorGrid>
              <ColorField label="Benim Mesajım" value={cfg.messages_my_color || '#14B8A6'}
                onChange={v => upd({ messages_my_color: v })} />
              <ColorField label="Karşı Taraf" value={cfg.messages_their_color || '#1E293B'}
                onChange={v => upd({ messages_their_color: v })} />
            </ColorGrid>
          </Section>
          <Section title="Mesaj Listesi">
            <ToggleField label="Çevrimiçi Yeşil Nokta" checked={cfg.messages_show_online_dot ?? true}
              onChange={v => upd({ messages_show_online_dot: v })} />
          </Section>
        </>)}

        {tab === 'kesfet' && (<>
          <Section title="Oda Kartları">
            <SliderField label="Kart Köşe Yuvarlaması" min={4} max={28} step={1}
              value={cfg.discover_card_radius ?? 14}
              onChange={v => upd({ discover_card_radius: v })}
              display={`${cfg.discover_card_radius ?? 14}px`} />
            <ToggleField label="Kart Altında Gölge" checked={cfg.discover_card_shadow ?? true}
              onChange={v => upd({ discover_card_shadow: v })} />
            <SliderField label="Grid Sütun Sayısı" min={1} max={3} step={1}
              value={cfg.discover_grid_columns ?? 2}
              onChange={v => upd({ discover_grid_columns: v })}
              display={`${cfg.discover_grid_columns ?? 2}`} />
          </Section>
        </>)}

        {tab === 'login' && (<>
          <Section title="Giriş Ekranı Arka Planı">
            <ColorGrid>
              <ColorField label="Gradient Üst" value={cfg.login_bg_gradient_from || '#0F1926'}
                onChange={v => upd({ login_bg_gradient_from: v })} />
              <ColorField label="Gradient Alt" value={cfg.login_bg_gradient_to || '#0A0F1A'}
                onChange={v => upd({ login_bg_gradient_to: v })} />
            </ColorGrid>
          </Section>
          <Section title="Logo & Butonlar">
            <SliderField label="Logo Boyutu" min={48} max={160} step={4}
              value={cfg.login_logo_size ?? 80}
              onChange={v => upd({ login_logo_size: v })}
              display={`${cfg.login_logo_size ?? 80}px`} />
            <SliderField label="Buton Köşe Yuvarlaması" min={4} max={32} step={1}
              value={cfg.login_button_radius ?? 12}
              onChange={v => upd({ login_button_radius: v })}
              display={`${cfg.login_button_radius ?? 12}px`} />
          </Section>
        </>)}

        {tab === 'anim' && (<>
          <Section title="Sayfa Geçişi">
            <SelectField label="Geçiş Tipi" value={cfg.anim_page_transition || 'fade'}
              options={[
                { value: 'fade', label: 'Fade' },
                { value: 'slide', label: 'Slide' },
                { value: 'none', label: 'Yok' },
              ]} onChange={v => upd({ anim_page_transition: v as any })} />
            <SliderField label="Modal Açılış Süresi" min={100} max={800} step={20}
              value={cfg.anim_modal_open_ms ?? 300}
              onChange={v => upd({ anim_modal_open_ms: v })}
              display={`${cfg.anim_modal_open_ms ?? 300}ms`} />
          </Section>
          <Section title="Etkileşim">
            <SliderField label="Buton Basma Scale" min={0.85} max={1} step={0.01}
              value={cfg.anim_button_press_scale ?? 0.96}
              onChange={v => upd({ anim_button_press_scale: v })}
              display={`${(cfg.anim_button_press_scale ?? 0.96).toFixed(2)}x`} />
            <ToggleField label="Hareket Azaltma (Accessibility)" checked={cfg.anim_reduce_motion ?? false}
              onChange={v => upd({ anim_reduce_motion: v })} />
          </Section>
        </>)}

        {tab === 'tipografi' && (<>
          <Section title="Font Ailesi & Boyut">
            <SelectField label="Font" value={cfg.typography_font_family || 'system'}
              options={[
                { value: 'system', label: 'Sistem (varsayılan)' },
                { value: 'inter', label: 'Inter' },
                { value: 'rounded', label: 'SF Rounded' },
              ]} onChange={v => upd({ typography_font_family: v as any })} />
            <SliderField label="Temel Yazı Boyutu" min={12} max={18} step={1}
              value={cfg.typography_base_size ?? 14}
              onChange={v => upd({ typography_base_size: v })}
              display={`${cfg.typography_base_size ?? 14}sp`} />
          </Section>
          <Section title="Başlık & Aralıklar">
            <SelectField label="Başlık Kalınlığı" value={cfg.typography_heading_weight || '700'}
              options={[
                { value: '500', label: 'Orta (500)' },
                { value: '600', label: 'Yarı Kalın (600)' },
                { value: '700', label: 'Kalın (700)' },
                { value: '800', label: 'Ekstra Kalın (800)' },
                { value: '900', label: 'En Kalın (900)' },
              ]} onChange={v => upd({ typography_heading_weight: v })} />
            <SliderField label="Harf Aralığı" min={-1} max={3} step={0.1}
              value={cfg.typography_letter_spacing ?? 0}
              onChange={v => upd({ typography_letter_spacing: v })}
              display={`${(cfg.typography_letter_spacing ?? 0).toFixed(1)}`} />
            <SliderField label="Satır Yüksekliği" min={1} max={2} step={0.05}
              value={cfg.typography_line_height ?? 1.4}
              onChange={v => upd({ typography_line_height: v })}
              display={`${(cfg.typography_line_height ?? 1.4).toFixed(2)}`} />
          </Section>
        </>)}

        {/* Aksiyon barı (her tab'da aynı) */}
        <div className="sticky bottom-2 z-10 backdrop-blur bg-slate-950/80 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between mt-4">
          <button type="button" onClick={() => confirm('Varsayılana dön?') && dispatch({ reset: true })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30">
            <RotateCcw className="w-3.5 h-3.5" /> Varsayılana dön
          </button>
          <div className="flex items-center gap-3">
            {status && <span className={`text-xs ${status.startsWith('✗') ? 'text-rose-400' : 'text-emerald-400'}`}>{status}</span>}
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30 hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Kaydet
            </button>
          </div>
        </div>
      </div>

      {/* SAĞ: Ana sayfadaki PhoneSimulator (tema renkleriyle) — oda-duzeni hariç */}
      <div className="xl:sticky xl:top-4 xl:self-start">
        <div className="rounded-xl border border-slate-700/40 bg-slate-900/30 p-3">
          <div className="text-xs text-slate-300 mb-3 font-medium flex items-center justify-between">
            <span>Canlı Önizleme — Mobile Uygulama</span>
            <span className="text-[10px] text-slate-500">4 sekme otomatik döner</span>
          </div>
          <div className="flex justify-center">
            <ThemedPhoneSimulator themeColors={cfg as any} />
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}

function PageSpecificStub({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-900/30 p-6 text-center">
      <div className="text-2xl mb-2">🚧</div>
      <h3 className="text-sm font-bold text-slate-200">{title}</h3>
      <p className="text-[11px] text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">{hint}</p>
      <div className="mt-3 text-[10px] text-amber-300/70">
        Bu bölümün detaylı slider'ları sıradaki güncellemede eklenecek. Şimdilik <strong>Genel Palet</strong> sekmesindeki renkler bu sayfaya da yansır.
      </div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-900/30 p-4 space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}
function ColorGrid({ children }: any) {
  return <div className="grid grid-cols-2 gap-2.5">{children}</div>;
}
function ColorField({ label, value, onChange }: any) {
  const norm = value?.startsWith('#') && (value.length === 7 || value.length === 4) ? value : '#000000';
  return (
    <label className="block">
      <div className="text-[10px] text-slate-400 mb-1">{label}</div>
      <div className="flex items-center gap-1.5">
        <input type="color" value={norm} onChange={e => onChange(e.target.value)}
          aria-label={`${label} renk seçici`}
          className="w-7 h-6 rounded border-0 bg-transparent cursor-pointer" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          aria-label={`${label} HEX değeri`}
          className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-slate-200" />
      </div>
    </label>
  );
}
function SliderField({ label, min, max, step, value, onChange, display }: any) {
  return (
    <label className="block">
      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
        <span>{label}</span>
        <span className="text-slate-200 font-mono">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        aria-label={label}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-rose-500" />
    </label>
  );
}
function ToggleField({ label, checked, onChange }: any) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-xs text-slate-400">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        aria-label={label}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-rose-500' : 'bg-slate-600'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
}
function SelectField({ label, value, options, onChange }: any) {
  return (
    <label className="block">
      <div className="text-[10px] text-slate-400 mb-1">{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        aria-label={label}
        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200">
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
