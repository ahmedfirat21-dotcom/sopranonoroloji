"use client";

import { useState } from 'react';
import { Pencil, Save, X, Copy, Check, AlertTriangle, Info } from 'lucide-react';

type Tier = {
  name: string;
  label: string;
  emoji: string;
  color: string;
  monthlyPrice: number;
  yearlyPrice: number;
  tagline: string;
  spBonus: number;
  limits: Record<string, any>;
};

export default function TierEditor({ tiers: initialTiers }: { tiers: Tier[] }) {
  const [tiers, setTiers] = useState(initialTiers);
  const [editing, setEditing] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);

  const update = (name: string, field: string, value: any) => {
    setTiers(prev => prev.map(t => t.name === name ? { ...t, [field]: value } : t));
  };

  const handleCopy = async () => {
    const code = generateTierCode(tiers);
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Kopyalama başarısız');
    }
  };

  return (
    <div className="space-y-5">
      {/* Bilgi kartı */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300">
          <strong className="text-blue-300">Nasıl çalışır:</strong> Tier konfigürasyonu mobil uygulamanın
          <code className="bg-black/40 px-1 mx-1 rounded">constants/tiers.ts</code> dosyasında sabit kodlu.
          Burada değiştirip <strong>"Mobile Kodu Üret"</strong> butonuna basınca yeni dosya içeriğini sana verir;
          o kodu projedeki dosyaya yapıştırıp yeni APK build alırsan değişiklikler kullanıcılara ulaşır.
        </div>
      </div>

      {/* 4 tier kartı yan yana */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {tiers.map(t => {
          const isEditing = editing === t.name;
          return (
            <div
              key={t.name}
              className="rounded-2xl border bg-white/5 overflow-hidden"
              style={{ borderColor: `${t.color}40` }}
            >
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ background: `linear-gradient(135deg, ${t.color}25, ${t.color}05)` }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{t.emoji}</span>
                  <div>
                    <div className="font-bold text-sm" style={{ color: t.color }}>{t.label}</div>
                    <div className="text-[10px] text-slate-400">{t.tagline}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(isEditing ? null : t.name)}
                  className="p-1.5 rounded-md hover:bg-white/10 text-slate-300"
                  title={isEditing ? 'Bitir' : 'Düzenle'}
                >
                  {isEditing ? <X className="w-4 h-4" /> : <Pencil className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-4 space-y-3 text-xs">
                <Row
                  label="Aylık Fiyat (TL)"
                  value={t.monthlyPrice}
                  isEditing={isEditing && t.name !== 'Free' && t.name !== 'GodMaster'}
                  onChange={v => update(t.name, 'monthlyPrice', parseFloat(v) || 0)}
                  format={n => n === 0 ? 'Ücretsiz' : `₺${n.toFixed(2)}`}
                />
                <Row
                  label="Yıllık Fiyat (TL)"
                  value={t.yearlyPrice}
                  isEditing={isEditing && t.name !== 'Free' && t.name !== 'GodMaster'}
                  onChange={v => update(t.name, 'yearlyPrice', parseFloat(v) || 0)}
                  format={n => n === 0 ? 'Ücretsiz' : `₺${n.toFixed(2)}`}
                />
                <Row
                  label="Hoşgeldin SP Bonusu"
                  value={t.spBonus}
                  isEditing={isEditing}
                  onChange={v => update(t.name, 'spBonus', parseInt(v, 10) || 0)}
                  format={n => n >= 999999 ? '∞' : `${n.toLocaleString('tr-TR')} SP`}
                />

                <div className="border-t border-white/5 pt-3">
                  <div className="text-[10px] tracking-wider text-slate-500 mb-2 font-semibold">ODA LİMİTLERİ</div>
                  <Row label="Sahnede Max" value={t.limits.maxSpeakers} isEditing={isEditing} onChange={v => updateLimit(setTiers, t.name, 'maxSpeakers', parseInt(v, 10) || 0)} />
                  <Row label="Dinleyici Max" value={t.limits.maxListeners} isEditing={isEditing} onChange={v => updateLimit(setTiers, t.name, 'maxListeners', parseInt(v, 10) || 0)} format={fmtUnlim} />
                  <Row label="Kamera Max" value={t.limits.maxCameras} isEditing={isEditing} onChange={v => updateLimit(setTiers, t.name, 'maxCameras', parseInt(v, 10) || 0)} format={fmtUnlim} />
                  <Row label="Moderatör Max" value={t.limits.maxModerators} isEditing={isEditing} onChange={v => updateLimit(setTiers, t.name, 'maxModerators', parseInt(v, 10) || 0)} format={fmtUnlim} />
                  <Row label="Açık Kalma Süresi (saat)" value={t.limits.durationHours} isEditing={isEditing} onChange={v => updateLimit(setTiers, t.name, 'durationHours', parseInt(v, 10) || 0)} format={n => n === 0 ? '7/24' : `${n} sa`} />
                  <Row label="Günlük Oda Limiti" value={t.limits.dailyRooms} isEditing={isEditing} onChange={v => updateLimit(setTiers, t.name, 'dailyRooms', parseInt(v, 10) || 0)} format={fmtUnlim} />
                  <Row label="Kalıcı Oda Sayısı" value={t.limits.maxPersistentRooms} isEditing={isEditing} onChange={v => updateLimit(setTiers, t.name, 'maxPersistentRooms', parseInt(v, 10) || 0)} format={fmtUnlim} />
                </div>

                <div className="border-t border-white/5 pt-3">
                  <div className="text-[10px] tracking-wider text-slate-500 mb-2 font-semibold">SES / VİDEO</div>
                  <Row label="Ses Sample Rate" value={t.limits.audioSampleRate} isEditing={isEditing} onChange={v => updateLimit(setTiers, t.name, 'audioSampleRate', parseInt(v, 10) || 24000)} format={n => `${n / 1000} kHz`} />
                  <Row label="Kanal" value={t.limits.audioChannels} isEditing={isEditing} onChange={v => updateLimit(setTiers, t.name, 'audioChannels', parseInt(v, 10) || 1)} format={n => n === 2 ? 'Stereo' : 'Mono'} />
                  <Row label="Video (max p)" value={t.limits.videoMaxRes} isEditing={isEditing} onChange={v => updateLimit(setTiers, t.name, 'videoMaxRes', parseInt(v, 10) || 0)} format={n => n === 0 ? '—' : `${n}p`} />
                </div>

                <div className="border-t border-white/5 pt-3">
                  <div className="text-[10px] tracking-wider text-slate-500 mb-2 font-semibold">ÖZELLİKLER</div>
                  <Toggle label="Resim Özelleştir" value={t.limits.canCustomizeImage} isEditing={isEditing} onChange={v => updateLimit(setTiers, t.name, 'canCustomizeImage', v)} />
                  <Toggle label="Tema Özelleştir" value={t.limits.canCustomizeTheme} isEditing={isEditing} onChange={v => updateLimit(setTiers, t.name, 'canCustomizeTheme', v)} />
                  <Toggle label="Oda Müziği" value={t.limits.canUseRoomMusic} isEditing={isEditing} onChange={v => updateLimit(setTiers, t.name, 'canUseRoomMusic', v)} />
                  <Toggle label="Sadece Arkadaşlar" value={t.limits.canUseFollowersOnly} isEditing={isEditing} onChange={v => updateLimit(setTiers, t.name, 'canUseFollowersOnly', v)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Aksiyonlar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setShowExport(true)}
          className="px-4 py-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <Save className="w-4 h-4" /> Mobile Kodu Üret
        </button>
        <button
          type="button"
          onClick={() => { setTiers(initialTiers); setEditing(null); }}
          className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 text-sm font-semibold transition-colors"
        >
          Sıfırla
        </button>
      </div>

      {showExport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-auto">
          <div className="bg-slate-900 border border-white/10 rounded-xl sm:rounded-2xl w-full max-w-3xl my-2 sm:my-8">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold">Üretilmiş Mobile Kodu</h2>
              <button type="button" onClick={() => setShowExport(false)} className="text-slate-400 hover:text-slate-200 text-xl">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 flex gap-2 text-xs text-amber-200/80">
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  Aşağıdaki kodu mobil projedeki <code className="bg-black/40 px-1 rounded">constants/tiers.ts</code>
                  dosyasına yapıştır ve yeni APK build al. Mevcut yüklü uygulamalar otomatik güncellenmez —
                  Play Store yayınından sonra etkili olur.
                </div>
              </div>
              <div className="relative">
                <pre className="bg-black/40 border border-white/10 rounded-lg p-3 text-[11px] font-mono overflow-auto max-h-96 text-slate-200 whitespace-pre-wrap">
                  {generateTierCode(tiers)}
                </pre>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="absolute top-2 right-2 px-2 py-1 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-xs font-semibold hover:bg-cyan-500/30 flex items-center gap-1"
                >
                  {copied ? <><Check className="w-3 h-3" /> Kopyalandı</> : <><Copy className="w-3 h-3" /> Kopyala</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, isEditing, onChange, format }: { label: string; value: number; isEditing: boolean; onChange: (v: string) => void; format?: (n: number) => string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      {isEditing ? (
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-label={label}
          title={label}
          className="w-24 px-2 py-1 text-right rounded bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none text-xs"
        />
      ) : (
        <span className="text-slate-200 font-mono">{format ? format(value) : value}</span>
      )}
    </div>
  );
}

function Toggle({ label, value, isEditing, onChange }: { label: string; value: boolean; isEditing: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      {isEditing ? (
        <input
          type="checkbox"
          checked={value}
          onChange={e => onChange(e.target.checked)}
          aria-label={label}
          title={label}
          className="cursor-pointer"
        />
      ) : (
        <span className={value ? 'text-emerald-400' : 'text-slate-600'}>{value ? '✓' : '—'}</span>
      )}
    </div>
  );
}

function updateLimit(setTiers: any, name: string, field: string, value: any) {
  setTiers((prev: Tier[]) => prev.map(t =>
    t.name === name ? { ...t, limits: { ...t.limits, [field]: value } } : t
  ));
}

function fmtUnlim(n: number): string {
  return n >= 999 ? '∞' : String(n);
}

function generateTierCode(tiers: Tier[]): string {
  const out: string[] = [];
  out.push('// constants/tiers.ts — Web admin panelinden üretildi');
  out.push('// ' + new Date().toLocaleString('tr-TR'));
  out.push('');
  out.push('export const TIER_DEFINITIONS = {');
  for (const t of tiers) {
    out.push(`  ${t.name}: {`);
    out.push(`    name: '${t.name}',`);
    out.push(`    label: '${t.label}',`);
    out.push(`    emoji: '${t.emoji}',`);
    out.push(`    color: '${t.color}',`);
    out.push(`    monthlyPrice: ${t.monthlyPrice},`);
    out.push(`    yearlyPrice: ${t.yearlyPrice},`);
    out.push(`    tagline: '${t.tagline.replace(/'/g, "\\'")}',`);
    out.push(`  },`);
  }
  out.push('};');
  out.push('');
  out.push('export const SUBSCRIPTION_SP_BONUS = {');
  for (const t of tiers) out.push(`  ${t.name}: ${t.spBonus},`);
  out.push('};');
  out.push('');
  out.push('export const ROOM_TIER_LIMITS = {');
  for (const t of tiers) {
    out.push(`  ${t.name}: ${JSON.stringify(t.limits, null, 4).replace(/\n/g, '\n    ')},`);
  }
  out.push('};');
  return out.join('\n');
}
