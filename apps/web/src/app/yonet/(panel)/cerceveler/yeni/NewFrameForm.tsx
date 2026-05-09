"use client";

/**
 * Yeni Çerçeve Formu — Lottie JSON upload + metadata + canlı önizleme + mağazaya ekleme.
 *
 * Akış:
 *  1. Kullanıcı isim/ID/fiyat/tier/rarity girer
 *  2. Lottie JSON dosyası yükler veya paste eder
 *  3. Önizleme: Lottie + sample avatar
 *  4. Kaydet → INSERT cosmetic_items + Lottie public/lotties/'e yükle
 *  5. Mağazada görünür hale gelir
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import { Save, Upload, Award, Wand2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SAMPLE_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop';

interface FormState {
  id: string;
  name: string;
  price_sp: number;
  min_tier: '' | 'Plus' | 'Pro';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary' | 'divine';
  art_color: string;
  tagline: string;
  scale: number;
  avatar_ratio: number;
}

const DEFAULT_FORM: FormState = {
  id: '',
  name: '',
  price_sp: 250,
  min_tier: '',
  rarity: 'rare',
  art_color: '#fbbf24',
  tagline: '',
  scale: 1.0,
  avatar_ratio: 0.92,
};

const RARITIES: { v: FormState['rarity']; l: string; c: string }[] = [
  { v: 'common', l: 'Common', c: '#94a3b8' },
  { v: 'uncommon', l: 'Uncommon', c: '#22c55e' },
  { v: 'rare', l: 'Rare', c: '#3b82f6' },
  { v: 'legendary', l: 'Legendary', c: '#a855f7' },
  { v: 'divine', l: 'Divine', c: '#fbbf24' },
];

export default function NewFrameForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [lottieJson, setLottieJson] = useState<any>(null);
  const [lottieFileName, setLottieFileName] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ★ AI Taslak — kullanıcı prompt yazar, AI önceden hazır bir Lottie taslağını
  //   parametrelendirip yükler. Backend Anthropic API varsa onu kullanır, yoksa
  //   keyword bazlı template seçer.
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);

  async function generateFromAI() {
    if (!aiPrompt.trim()) return;
    setAiBusy(true);
    setAiNote(null);
    setError(null);
    try {
      const res = await fetch('/api/yonet/frames/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'AI taslak oluşturulamadı');
      }
      const data = await res.json();
      // Backend dönen: { lottieJson, suggestedForm, note }
      if (data.lottieJson) {
        setLottieJson(data.lottieJson);
        setLottieFileName(data.suggestedForm?.id ? `${data.suggestedForm.id}-template.json` : 'ai-template.json');
      }
      if (data.suggestedForm) {
        setForm(f => ({ ...f, ...data.suggestedForm }));
      }
      setAiNote(data.note || 'Taslak hazır! Detayları gözden geçir ve kaydet.');
    } catch (e: any) {
      setError(e?.message || 'AI hatası');
    } finally {
      setAiBusy(false);
    }
  }

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(f => ({ ...f, [k]: v }));
    setError(null);
  }

  // İsim → ID (slug) otomatik
  useEffect(() => {
    if (form.name && !form.id) {
      const slug = form.name.toLowerCase()
        .replace(/[ğ]/g, 'g').replace(/[ü]/g, 'u').replace(/[ş]/g, 's')
        .replace(/[ı]/g, 'i').replace(/[ö]/g, 'o').replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      setForm(f => ({ ...f, id: slug }));
    }
  }, [form.name]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.json') && !f.name.toLowerCase().endsWith('.lottie')) {
      setError('Sadece .json veya .lottie kabul edilir');
      return;
    }
    setLottieFileName(f.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const json = JSON.parse(text);
        setLottieJson(json);
        setError(null);
      } catch {
        setError('Geçersiz JSON');
      }
    };
    reader.readAsText(f);
  }

  async function save() {
    if (!form.id || !form.name) {
      setError('İsim ve ID zorunlu');
      return;
    }
    if (!lottieJson) {
      setError('Lottie dosyası yükle');
      return;
    }
    setSaving(true);
    setNote(null);
    setError(null);
    try {
      const res = await fetch('/api/yonet/frames/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, lottieJson }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Kayıt başarısız');
      }
      setNote('Çerçeve oluşturuldu! Mağazada görünür hale geldi.');
      setTimeout(() => router.push('/yonet/cerceveler'), 1500);
    } catch (e: any) {
      setError(e?.message || 'Beklenmeyen hata');
    } finally {
      setSaving(false);
    }
  }

  const previewSize = 280;
  const avatarSize = Math.round(previewSize * form.avatar_ratio);
  const frameContainerSize = Math.round(previewSize * form.scale);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-6">
      {/* SOL — preview */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-300">Önizleme</h2>
        <div className="relative rounded-lg shadow-2xl"
          style={{ width: previewSize + 80, height: previewSize + 80, background: 'linear-gradient(180deg, #1e293b 0%, #0a0f1a 100%)', overflow: 'hidden' }}
        >
          {/* Avatar — merkezi */}
          <div style={{
            position: 'absolute',
            left: (previewSize + 80 - avatarSize) / 2, top: (previewSize + 80 - avatarSize) / 2,
            width: avatarSize, height: avatarSize,
            borderRadius: '50%', overflow: 'hidden', zIndex: 2,
          }}>
            <img src={SAMPLE_AVATAR} alt="" className="w-full h-full object-cover" />
          </div>
          {/* Frame Lottie — avatar etrafında */}
          {lottieJson && (
            <div style={{
              position: 'absolute',
              left: (previewSize + 80 - frameContainerSize) / 2,
              top: (previewSize + 80 - frameContainerSize) / 2,
              width: frameContainerSize, height: frameContainerSize,
              zIndex: 3, pointerEvents: 'none',
            }}>
              <Lottie animationData={lottieJson} loop autoplay style={{ width: '100%', height: '100%' }} />
            </div>
          )}
          {!lottieJson && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">
              Lottie yükleyin →
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Avatar mock üzerinde frame görünümü. Sonradan editörde ince ayar yapabilirsiniz.
        </p>
      </div>

      {/* SAĞ — form */}
      <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
        {/* ★ AI Taslak Oluşturucu */}
        <div className="rounded-lg border border-violet-500/40 bg-gradient-to-br from-violet-900/40 to-fuchsia-900/30 p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-200 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-violet-300" /> AI Taslak Oluşturucu
          </h3>
          <p className="text-[11px] text-slate-400">
            Çerçeveni nasıl tasarlamak istediğini yaz, AI sana hazır bir taslak oluştursun. Örn: "Gold halkalı kanatları olan dönen bir çerçeve" / "Mavi neon parıltılı dairesel ring" / "Kırmızı ateş alevleri saran çerçeve"
          </p>
          <textarea
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="Hayalimdeki çerçeve..."
            rows={3}
            className="w-full bg-slate-900/70 border border-slate-700 rounded px-3 py-2 text-sm placeholder:text-slate-500 focus:border-violet-500/60 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button type="button" onClick={generateFromAI} disabled={aiBusy || !aiPrompt.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-violet-600 hover:bg-violet-500 disabled:bg-violet-900 disabled:cursor-not-allowed text-white text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              {aiBusy ? 'Düşünüyor...' : 'Taslak Oluştur'}
            </button>
          </div>
          {aiNote && <div className="text-xs text-emerald-300 bg-emerald-500/10 rounded p-2">{aiNote}</div>}
        </div>

        <Section title="Temel Bilgiler" icon={<Award className="w-4 h-4 text-amber-400" />}>
          <Input label="İsim *" value={form.name} onChange={v => update('name', v)} placeholder="Örn: Phoenix Halkası" />
          <Input label="ID (slug) *" value={form.id} onChange={v => update('id', v)} placeholder="phoenix-halkasi" mono />
          <Input label="Tagline" value={form.tagline} onChange={v => update('tagline', v)} placeholder="Yeniden doğan kanat" />
        </Section>

        <Section title="Mağaza Ayarları" icon={<Award className="w-4 h-4 text-emerald-400" />}>
          <NumberInput label="Fiyat (SP)" value={form.price_sp} onChange={v => update('price_sp', v)} min={0} step={10} />
          <Select label="Minimum Tier" value={form.min_tier} onChange={v => update('min_tier', v as any)} options={[
            { v: '', l: 'Herkes' },
            { v: 'Plus', l: 'Plus +' },
            { v: 'Pro', l: 'Pro +' },
          ]} />
          <Select label="Nadirlik" value={form.rarity} onChange={v => update('rarity', v as any)} options={RARITIES.map(r => ({ v: r.v, l: r.l }))} />
          <ColorInput label="Tema Rengi" value={form.art_color} onChange={v => update('art_color', v)} />
        </Section>

        <Section title="Lottie Kaynak" icon={<Upload className="w-4 h-4 text-cyan-400" />}>
          <div>
            <input ref={fileInputRef} type="file" accept=".json,.lottie,application/json"
              onChange={onFile} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-slate-600 hover:border-cyan-500/60 hover:bg-cyan-500/5 transition-colors text-sm flex items-center justify-center gap-2 text-slate-300">
              <Upload className="w-4 h-4" />
              {lottieFileName ? <code className="text-cyan-300">{lottieFileName}</code> : 'Lottie JSON dosyası seç'}
            </button>
          </div>
          {lottieJson && (
            <p className="text-[11px] text-slate-500">
              Boyut: {lottieJson.w}×{lottieJson.h} · Süre: {((lottieJson.op || 0) / (lottieJson.fr || 30)).toFixed(1)}sn
            </p>
          )}
        </Section>

        <Section title="Frame Ayarları (Hızlı)" icon={<Award className="w-4 h-4 text-purple-400" />}>
          <Slider label="Frame Ölçek" min={0.6} max={2} step={0.05} value={form.scale} onChange={v => update('scale', v)} display={`${form.scale.toFixed(2)}x`} />
          <Slider label="Avatar İç Oran" min={0.6} max={1} step={0.01} value={form.avatar_ratio} onChange={v => update('avatar_ratio', v)} display={`%${Math.round(form.avatar_ratio * 100)}`} />
          <p className="text-[11px] text-slate-500">Kayıttan sonra detaylı editörle ince ayar yapılabilir.</p>
        </Section>

        {error && <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded p-2">{error}</div>}
        {note && <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded p-2">{note}</div>}

        <div className="flex items-center gap-2 sticky bottom-0 bg-[#0a0f1a]/95 backdrop-blur-md py-2">
          <button type="button" onClick={save} disabled={saving || !form.name || !form.id || !lottieJson}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-amber-600 hover:bg-amber-500 disabled:bg-amber-900 disabled:cursor-not-allowed text-white text-sm font-medium">
            <Save className="w-4 h-4" />
            {saving ? 'Kaydediliyor...' : 'Çerçeveyi Oluştur ve Mağazaya Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── UI Helpers ───
function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-4 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
        {icon}{title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Input({ label, value, onChange, placeholder, mono }: any) {
  return (
    <label className="block">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm ${mono ? 'font-mono' : ''}`} />
    </label>
  );
}
function NumberInput({ label, value, onChange, min, step }: any) {
  return (
    <label className="block">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <input type="number" value={value} min={min} step={step} onChange={e => onChange(parseInt(e.target.value, 10) || 0)}
        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm" />
    </label>
  );
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <label className="block">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}
function Slider({ label, min, max, step, value, onChange, display }: any) {
  return (
    <label className="block">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span className="text-slate-300 font-mono">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full accent-amber-500" />
    </label>
  );
}
function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-10 h-8 rounded border-0 bg-transparent cursor-pointer" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono" />
      </div>
    </label>
  );
}
