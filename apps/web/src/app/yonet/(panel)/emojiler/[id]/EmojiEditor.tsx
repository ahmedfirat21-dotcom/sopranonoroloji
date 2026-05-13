"use client";

/**
 * Özel Emoji Editörü — set yönetimi, sıralama, animasyon, kategoriler.
 * 7 sekme: Liste / Görsel / Animasyon / Sıralama / Kategori / Kullanım / Genel
 */
import React, { useReducer, useTransition } from 'react';
import { Save, RotateCcw, Smile, Image as ImageIcon, Activity, ListOrdered, Tag, Hand, Settings as SettingsIcon, Loader2, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { saveEmojiConfig } from './actions';

type Tab = 'list' | 'visual' | 'anim' | 'order' | 'category' | 'usage' | 'general';

interface EmojiItem {
  id: string;
  shortcode: string;       // :sopranolove:
  image_url: string;
  alt_text: string;
  is_animated: boolean;
}

type AnimType = 'none' | 'pulse' | 'rotate' | 'bounce' | 'shake' | 'shimmer';
type RenderType = 'png' | 'gif' | 'webp' | 'lottie';

interface EmojiConfig {
  // Set bilgisi
  set_name: string;
  set_short_name: string;   // tab adı
  set_color: string;        // kategori badge rengi
  set_icon: string;         // tab ikon emoji
  // Emojiler
  emojis: EmojiItem[];
  // Görsel
  render_type: RenderType;
  display_size: number;     // 24-48 px
  inline_size: number;      // 16-22 px (yazı içinde)
  preserve_aspect: boolean;
  padding: number;
  hover_scale: number;      // 1-1.4
  // Animasyon (set genelinde)
  animation: AnimType;
  anim_speed_ms: number;
  anim_only_on_hover: boolean;
  loop_count: number;       // 0=sonsuz, 1+ sayı
  // Sıralama
  sort_mode: 'manual' | 'alphabetical' | 'newest' | 'popular';
  show_in_recents: boolean;
  show_in_favorites: boolean;
  // Kategori
  display_category: 'classic' | 'animated' | 'premium' | 'soprano-special';
  is_featured: boolean;
  badge_text: string;
  badge_color: string;
  // Kullanım
  allowed_in_messages: boolean;
  allowed_in_reactions: boolean;
  allowed_in_status: boolean;
  allowed_in_bio: boolean;
  max_uses_per_day: number;  // 0 = sınırsız
  cooldown_seconds: number;
  // Genel
  set_description: string;
  unlock_tier: 'free' | 'plus' | 'pro' | 'gm';
  preview_in_picker: boolean;
}

const DEFAULT_CFG: EmojiConfig = {
  set_name: 'Soprano Klasikleri',
  set_short_name: 'Klasik',
  set_color: '#14B8A6',
  set_icon: '🎵',
  emojis: [],
  render_type: 'png',
  display_size: 32,
  inline_size: 20,
  preserve_aspect: true,
  padding: 2,
  hover_scale: 1.15,
  animation: 'none',
  anim_speed_ms: 800,
  anim_only_on_hover: true,
  loop_count: 0,
  sort_mode: 'manual',
  show_in_recents: true,
  show_in_favorites: true,
  display_category: 'classic',
  is_featured: false,
  badge_text: '',
  badge_color: '#FBBF24',
  allowed_in_messages: true,
  allowed_in_reactions: true,
  allowed_in_status: false,
  allowed_in_bio: false,
  max_uses_per_day: 0,
  cooldown_seconds: 0,
  set_description: '',
  unlock_tier: 'free',
  preview_in_picker: true,
};

function reducer(state: EmojiConfig, action: Partial<EmojiConfig> | { reset: true }): EmojiConfig {
  if ('reset' in action) return DEFAULT_CFG;
  return { ...state, ...action };
}

export default function EmojiEditor({ item }: { item: any }) {
  const initial: EmojiConfig = { ...DEFAULT_CFG, ...((item.editor_config as any)?.emoji_config || {}) };
  const [cfg, dispatch] = useReducer(reducer, initial);
  const [tab, setTab] = React.useState<Tab>('list');
  const [saving, startSave] = useTransition();
  const [status, setStatus] = React.useState<string | null>(null);

  const upd = (patch: Partial<EmojiConfig>) => dispatch(patch);
  const updateEmoji = (idx: number, patch: Partial<EmojiItem>) => {
    const next = [...cfg.emojis];
    next[idx] = { ...next[idx], ...patch };
    upd({ emojis: next });
  };
  const removeEmoji = (idx: number) => upd({ emojis: cfg.emojis.filter((_, i) => i !== idx) });
  const moveEmoji = (idx: number, dir: -1 | 1) => {
    const next = [...cfg.emojis];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    upd({ emojis: next });
  };
  const addEmoji = () => upd({
    emojis: [...cfg.emojis, { id: `e_${Date.now()}`, shortcode: ':yeni:', image_url: '', alt_text: 'Yeni emoji', is_animated: false }],
  });

  const handleSave = () => {
    setStatus(null);
    startSave(async () => {
      const res = await saveEmojiConfig(item.id, cfg as any);
      setStatus(res.ok ? '✓ Kaydedildi' : `✗ Hata: ${res.error}`);
      setTimeout(() => setStatus(null), 3000);
    });
  };

  const TABS: { k: Tab; l: string; i: React.ReactNode }[] = [
    { k: 'list',     l: 'Liste',     i: <Smile className="w-3.5 h-3.5" /> },
    { k: 'visual',   l: 'Görsel',    i: <ImageIcon className="w-3.5 h-3.5" /> },
    { k: 'anim',     l: 'Anim',      i: <Activity className="w-3.5 h-3.5" /> },
    { k: 'order',    l: 'Sıra',      i: <ListOrdered className="w-3.5 h-3.5" /> },
    { k: 'category', l: 'Kategori',  i: <Tag className="w-3.5 h-3.5" /> },
    { k: 'usage',    l: 'Kullanım',  i: <Hand className="w-3.5 h-3.5" /> },
    { k: 'general',  l: 'Genel',     i: <SettingsIcon className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-4 items-start">
      <div className="flex-1 min-w-0 w-full space-y-3">
        <div className="flex items-center gap-1 bg-slate-900/50 border border-slate-700/40 rounded-xl p-1 overflow-x-auto sticky top-0 z-10 backdrop-blur">
          {TABS.map(t => (
            <button key={t.k} type="button" onClick={() => setTab(t.k)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                tab === t.k
                  ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/20 text-yellow-100 border border-yellow-500/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
              }`}>
              {t.i}{t.l}
            </button>
          ))}
        </div>

        <div className="pb-20 space-y-3">
          {tab === 'list' && <ListPanel cfg={cfg} upd={upd} updateEmoji={updateEmoji} removeEmoji={removeEmoji} moveEmoji={moveEmoji} addEmoji={addEmoji} />}
          {tab === 'visual' && <VisualPanel cfg={cfg} upd={upd} />}
          {tab === 'anim' && <AnimPanel cfg={cfg} upd={upd} />}
          {tab === 'order' && <OrderPanel cfg={cfg} upd={upd} />}
          {tab === 'category' && <CategoryPanel cfg={cfg} upd={upd} />}
          {tab === 'usage' && <UsagePanel cfg={cfg} upd={upd} />}
          {tab === 'general' && <GeneralPanel cfg={cfg} upd={upd} />}
        </div>

        <div className="fixed left-0 right-0 bottom-0 z-50 border-t border-slate-700/50 bg-slate-950/90 backdrop-blur px-4 py-3 lg:left-64">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <button type="button" onClick={() => confirm('Varsayılana dön?') && dispatch({ reset: true })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30">
              <RotateCcw className="w-3.5 h-3.5" /> Sıfırla
            </button>
            <div className="flex items-center gap-3">
              {status && <span className={`text-xs ${status.startsWith('✗') ? 'text-rose-400' : 'text-emerald-400'}`}>{status}</span>}
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/30 hover:opacity-90 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full xl:w-[380px] xl:sticky xl:top-4 xl:self-start shrink-0">
        <div className="rounded-xl border border-slate-700/40 bg-slate-900/30 p-3">
          <div className="text-xs text-slate-300 mb-3 font-medium">Canlı Önizleme</div>
          <EmojiPickerPreview cfg={cfg} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, hint, action }: any) {
  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-900/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">{title}</h3>
          {hint && <p className="text-[10px] text-slate-500 mt-0.5">{hint}</p>}
        </div>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Slider({ label, min, max, step, value, onChange, display }: any) {
  return (
    <label className="block">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span><span className="text-slate-200 font-mono">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} className="w-full accent-yellow-500" />
    </label>
  );
}
function Toggle({ label, checked, onChange }: any) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-xs text-slate-400">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-yellow-500' : 'bg-slate-600'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
}
function ColorField({ label, value, onChange }: any) {
  const norm = value?.startsWith('#') && (value.length === 7 || value.length === 4) ? value : '#000000';
  return (
    <label className="block">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <input type="color" value={norm} onChange={e => onChange(e.target.value)} className="w-9 h-7 rounded border-0 bg-transparent cursor-pointer" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200" />
      </div>
    </label>
  );
}
function SelectField({ label, value, options, onChange }: any) {
  return (
    <label className="block">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200">
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
function TextField({ label, value, onChange, placeholder, mono }: any) {
  return (
    <label className="block">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 ${mono ? 'font-mono' : ''}`} />
    </label>
  );
}

function ListPanel({ cfg, upd, updateEmoji, removeEmoji, moveEmoji, addEmoji }: any) {
  return (
    <div className="space-y-3">
      <Section title="Set Bilgisi">
        <TextField label="Set Adı" value={cfg.set_name} onChange={(v: string) => upd({ set_name: v })} placeholder="Soprano Klasikleri" />
        <TextField label="Kısa İsim (Tab)" value={cfg.set_short_name} onChange={(v: string) => upd({ set_short_name: v })} placeholder="Klasik" />
        <TextField label="Set İkonu (Emoji)" value={cfg.set_icon} onChange={(v: string) => upd({ set_icon: v })} placeholder="🎵" />
        <ColorField label="Set Rengi" value={cfg.set_color} onChange={(v: string) => upd({ set_color: v })} />
      </Section>

      <Section title="Emoji Listesi" hint={`${cfg.emojis.length} emoji`}
        action={<button type="button" onClick={addEmoji} className="text-xs px-2 py-1 rounded bg-yellow-500/20 border border-yellow-500/40 text-yellow-200 inline-flex items-center gap-1 hover:bg-yellow-500/30"><Plus className="w-3 h-3" /> Ekle</button>}>
        {cfg.emojis.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-4">Henüz emoji eklenmemiş. + Ekle butonuna basın.</div>
        ) : (
          <div className="space-y-2">
            {cfg.emojis.map((e: EmojiItem, idx: number) => (
              <div key={e.id} className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-2 flex items-start gap-2">
                <div className="w-10 h-10 rounded bg-slate-900 flex items-center justify-center shrink-0">
                  {e.image_url ? <img src={e.image_url} alt={e.alt_text} className="max-w-full max-h-full object-contain" /> : <Smile className="w-5 h-5 text-slate-600" />}
                </div>
                <div className="flex-1 space-y-1">
                  <input type="text" value={e.shortcode} onChange={ev => updateEmoji(idx, { shortcode: ev.target.value })} placeholder=":kisa-kod:"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200" />
                  <input type="text" value={e.image_url} onChange={ev => updateEmoji(idx, { image_url: ev.target.value })} placeholder="https://... (PNG/GIF/WebP)"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono text-slate-200" />
                  <input type="text" value={e.alt_text} onChange={ev => updateEmoji(idx, { alt_text: ev.target.value })} placeholder="Alt metin (erişilebilirlik)"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200" />
                  <label className="flex items-center gap-1 text-[10px] text-slate-500">
                    <input type="checkbox" checked={e.is_animated} onChange={ev => updateEmoji(idx, { is_animated: ev.target.checked })} className="accent-yellow-500" />
                    Animasyonlu (GIF/WebP)
                  </label>
                </div>
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button type="button" onClick={() => moveEmoji(idx, -1)} className="p-1 text-slate-400 hover:text-slate-100" title="Yukarı"><ChevronUp className="w-3 h-3" /></button>
                  <button type="button" onClick={() => moveEmoji(idx, 1)} className="p-1 text-slate-400 hover:text-slate-100" title="Aşağı"><ChevronDown className="w-3 h-3" /></button>
                  <button type="button" onClick={() => removeEmoji(idx)} className="p-1 text-rose-400 hover:text-rose-300" title="Sil"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function VisualPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Render Tipi">
        <SelectField label="Format" value={cfg.render_type} options={[
          { value: 'png', label: 'PNG (Statik)' },
          { value: 'gif', label: 'GIF (Animasyonlu)' },
          { value: 'webp', label: 'WebP (Modern + Animasyon)' },
          { value: 'lottie', label: 'Lottie JSON' },
        ]} onChange={(v: any) => upd({ render_type: v })} />
      </Section>
      <Section title="Boyutlar">
        <Slider label="Picker'da Boyut" min={20} max={64} step={1} value={cfg.display_size} onChange={(v: number) => upd({ display_size: v })} display={`${cfg.display_size}px`} />
        <Slider label="Inline (yazı içi) Boyut" min={14} max={28} step={1} value={cfg.inline_size} onChange={(v: number) => upd({ inline_size: v })} display={`${cfg.inline_size}px`} />
        <Slider label="Padding" min={0} max={8} step={1} value={cfg.padding} onChange={(v: number) => upd({ padding: v })} display={`${cfg.padding}px`} />
        <Toggle label="Aspect Ratio Koru" checked={cfg.preserve_aspect} onChange={(v: boolean) => upd({ preserve_aspect: v })} />
      </Section>
      <Section title="Hover Efekti">
        <Slider label="Hover Scale" min={1} max={1.5} step={0.05} value={cfg.hover_scale} onChange={(v: number) => upd({ hover_scale: v })} display={`${cfg.hover_scale.toFixed(2)}x`} />
      </Section>
    </div>
  );
}

function AnimPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Set Animasyonu" hint="Tüm emojilere uygulanan ortak animasyon">
        <SelectField label="Tip" value={cfg.animation} options={[
          { value: 'none', label: 'Yok' },
          { value: 'pulse', label: 'Pulse' },
          { value: 'rotate', label: 'Dönme' },
          { value: 'bounce', label: 'Zıplama' },
          { value: 'shake', label: 'Titreşim' },
          { value: 'shimmer', label: 'Parıltı' },
        ]} onChange={(v: any) => upd({ animation: v })} />
        {cfg.animation !== 'none' && (<>
          <Slider label="Hız" min={200} max={3000} step={50} value={cfg.anim_speed_ms} onChange={(v: number) => upd({ anim_speed_ms: v })} display={`${cfg.anim_speed_ms}ms`} />
          <Toggle label="Sadece Hover'da" checked={cfg.anim_only_on_hover} onChange={(v: boolean) => upd({ anim_only_on_hover: v })} />
          <Slider label="Loop Sayısı (0=sonsuz)" min={0} max={10} step={1} value={cfg.loop_count} onChange={(v: number) => upd({ loop_count: v })} display={cfg.loop_count === 0 ? '∞' : `${cfg.loop_count}`} />
        </>)}
      </Section>
    </div>
  );
}

function OrderPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Sıralama Kuralı">
        <SelectField label="Mod" value={cfg.sort_mode} options={[
          { value: 'manual', label: 'Manuel (Liste sırası)' },
          { value: 'alphabetical', label: 'Alfabetik (shortcode)' },
          { value: 'newest', label: 'En Yeni Önce' },
          { value: 'popular', label: 'Popüler Önce' },
        ]} onChange={(v: any) => upd({ sort_mode: v })} />
      </Section>
      <Section title="Görünürlük">
        <Toggle label="'Son Kullanılanlar'da göster" checked={cfg.show_in_recents} onChange={(v: boolean) => upd({ show_in_recents: v })} />
        <Toggle label="'Favoriler'de göster" checked={cfg.show_in_favorites} onChange={(v: boolean) => upd({ show_in_favorites: v })} />
      </Section>
    </div>
  );
}

function CategoryPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Kategori">
        <SelectField label="Görüntüleme Kategorisi" value={cfg.display_category} options={[
          { value: 'classic', label: '🎵 Klasik' },
          { value: 'animated', label: '🎬 Animasyonlu' },
          { value: 'premium', label: '👑 Premium' },
          { value: 'soprano-special', label: '🎤 Soprano Özel' },
        ]} onChange={(v: any) => upd({ display_category: v })} />
        <Toggle label="Öne Çıkan (Featured)" checked={cfg.is_featured} onChange={(v: boolean) => upd({ is_featured: v })} />
      </Section>
      <Section title="Rozet">
        <TextField label="Rozet Metni" value={cfg.badge_text} onChange={(v: string) => upd({ badge_text: v })} placeholder="YENİ / POPÜLER / sınırlı" />
        <ColorField label="Rozet Rengi" value={cfg.badge_color} onChange={(v: string) => upd({ badge_color: v })} />
      </Section>
    </div>
  );
}

function UsagePanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Nerelerde Kullanılabilir">
        <Toggle label="Mesajlarda" checked={cfg.allowed_in_messages} onChange={(v: boolean) => upd({ allowed_in_messages: v })} />
        <Toggle label="Reaksiyonlarda" checked={cfg.allowed_in_reactions} onChange={(v: boolean) => upd({ allowed_in_reactions: v })} />
        <Toggle label="Durum (Status)" checked={cfg.allowed_in_status} onChange={(v: boolean) => upd({ allowed_in_status: v })} />
        <Toggle label="Biyografi" checked={cfg.allowed_in_bio} onChange={(v: boolean) => upd({ allowed_in_bio: v })} />
      </Section>
      <Section title="Kullanım Sınırı">
        <Slider label="Günlük Max (0=sınırsız)" min={0} max={500} step={5} value={cfg.max_uses_per_day} onChange={(v: number) => upd({ max_uses_per_day: v })} display={cfg.max_uses_per_day === 0 ? '∞' : `${cfg.max_uses_per_day}/gün`} />
        <Slider label="Cooldown" min={0} max={300} step={5} value={cfg.cooldown_seconds} onChange={(v: number) => upd({ cooldown_seconds: v })} display={cfg.cooldown_seconds === 0 ? 'Yok' : `${cfg.cooldown_seconds}sn`} />
      </Section>
    </div>
  );
}

function GeneralPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Açıklama">
        <TextField label="Set Açıklaması" value={cfg.set_description} onChange={(v: string) => upd({ set_description: v })} placeholder="Bu setin teması ve özellikleri…" />
      </Section>
      <Section title="Erişim">
        <SelectField label="Açılma Tier'ı" value={cfg.unlock_tier} options={[
          { value: 'free', label: 'Free (Herkes)' },
          { value: 'plus', label: 'Plus+' },
          { value: 'pro', label: 'Pro+' },
          { value: 'gm', label: 'GM' },
        ]} onChange={(v: any) => upd({ unlock_tier: v })} />
        <Toggle label="Picker'da Önizleme Göster" checked={cfg.preview_in_picker} onChange={(v: boolean) => upd({ preview_in_picker: v })} />
      </Section>
    </div>
  );
}

/* ─── Preview ─── */
function EmojiPickerPreview({ cfg }: { cfg: EmojiConfig }) {
  const animMap: Record<string, string> = {
    pulse: `emoji-pulse ${cfg.anim_speed_ms}ms ease-in-out infinite`,
    rotate: `emoji-rotate ${cfg.anim_speed_ms}ms linear infinite`,
    bounce: `emoji-bounce ${cfg.anim_speed_ms}ms ease-in-out infinite`,
    shake: `emoji-shake ${cfg.anim_speed_ms}ms linear infinite`,
    shimmer: `emoji-shimmer ${cfg.anim_speed_ms}ms ease-in-out infinite`,
  };
  const setAnim = cfg.animation !== 'none' && !cfg.anim_only_on_hover ? animMap[cfg.animation] : undefined;
  const hoverAnim = cfg.animation !== 'none' && cfg.anim_only_on_hover ? animMap[cfg.animation] : undefined;

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-700/40 overflow-hidden">
      <style>{`
        @keyframes emoji-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes emoji-rotate { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes emoji-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes emoji-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-2px)} 75%{transform:translateX(2px)} }
        @keyframes emoji-shimmer { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.4)} }
        .emoji-preview-hover:hover { transform: scale(${cfg.hover_scale}); ${hoverAnim ? `animation: ${hoverAnim};` : ''} }
      `}</style>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-2 py-2 border-b" style={{ borderColor: cfg.set_color + '33' }}>
        <button type="button" className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold"
          style={{ background: cfg.set_color + '22', color: cfg.set_color, border: `1px solid ${cfg.set_color}55` }}>
          <span>{cfg.set_icon}</span>{cfg.set_short_name}
        </button>
        <div className="text-[10px] text-slate-500 ml-2">{cfg.emojis.length} emoji</div>
        {cfg.is_featured && cfg.badge_text && (
          <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: cfg.badge_color, color: '#0F172A' }}>
            {cfg.badge_text}
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="p-3">
        {cfg.emojis.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            <Smile className="w-10 h-10 mx-auto mb-2 opacity-40" />
            Emoji listesi boş
          </div>
        ) : (
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fill, ${cfg.display_size + cfg.padding * 2 + 4}px)` }}>
            {cfg.emojis.map(e => (
              <div key={e.id}
                title={e.shortcode}
                className="emoji-preview-hover transition-transform cursor-pointer flex items-center justify-center rounded-md hover:bg-white/5"
                style={{
                  width: cfg.display_size + cfg.padding * 2,
                  height: cfg.display_size + cfg.padding * 2,
                  padding: cfg.padding,
                  animation: setAnim,
                }}
              >
                {e.image_url ? (
                  <img src={e.image_url} alt={e.alt_text}
                    style={{ width: cfg.display_size, height: cfg.display_size, objectFit: cfg.preserve_aspect ? 'contain' : 'fill' }} />
                ) : (
                  <Smile className="text-slate-600" style={{ width: cfg.display_size * 0.7, height: cfg.display_size * 0.7 }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mesaj örneği */}
      <div className="px-3 pb-3 pt-2 border-t border-slate-700/40">
        <div className="text-[10px] text-slate-500 mb-1.5">Yazı içinde inline</div>
        <div className="text-slate-300 text-xs">
          Selam {cfg.emojis.slice(0, 2).map(e => e.image_url ? (
            <img key={e.id} src={e.image_url} alt={e.alt_text} className="inline-block align-middle"
              style={{ width: cfg.inline_size, height: cfg.inline_size, margin: '0 2px' }} />
          ) : <span key={e.id}>{e.shortcode}</span>)} nasılsın?
        </div>
      </div>
    </div>
  );
}
