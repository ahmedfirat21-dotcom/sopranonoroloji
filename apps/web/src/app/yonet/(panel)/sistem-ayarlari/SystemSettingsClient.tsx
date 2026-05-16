"use client";

/**
 * Sistem Ayarları — client component (toggle/inputs + save).
 *
 * 4 kategori:
 *  1. Bakım modu (maintenance_mode/message/eta)
 *  2. Zorunlu güncelleme (min_supported_version/force_update/message)
 *  3. Genel banner (banner_enabled/text/severity)
 *  4. Özellik bayrakları (feature_flags JSON)
 *
 * APK tarafı `services/systemSettings.ts` ile dinler.
 */
import { useState } from 'react';
import { Save, Loader2, AlertTriangle, RotateCcw, Wrench, Smartphone, Megaphone, ToggleRight } from 'lucide-react';
import { useAdminDialog } from '../../_components/AdminDialog';

type Settings = {
  id: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  maintenance_eta: string | null;
  min_supported_version: string | null;
  force_update: boolean;
  force_update_message: string;
  feature_flags: Record<string, any>;
  banner_enabled: boolean;
  banner_text: string;
  banner_severity: 'info' | 'warning' | 'danger' | 'success';
  updated_at: string;
  updated_by: string | null;
};

const SEVERITY_META: Record<string, { label: string; color: string }> = {
  info:    { label: 'Bilgi',  color: '#5EEAD4' },
  warning: { label: 'Uyarı',  color: '#FBBF24' },
  danger:  { label: 'Tehlike', color: '#F87171' },
  success: { label: 'Başarı', color: '#34D399' },
};

export default function SystemSettingsClient({ initial }: { initial: Settings }) {
  const dialog = useAdminDialog();
  const [s, setS] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [flagsJson, setFlagsJson] = useState<string>(JSON.stringify(initial.feature_flags || {}, null, 2));
  const [flagsErr, setFlagsErr] = useState<string | null>(null);

  const update = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    setS(prev => ({ ...prev, [k]: v }));
  };

  const handleSave = async () => {
    // Feature flags JSON validation
    let parsedFlags: Record<string, any> = {};
    try {
      parsedFlags = JSON.parse(flagsJson);
      if (typeof parsedFlags !== 'object' || Array.isArray(parsedFlags)) {
        throw new Error('Feature flags bir JSON object olmalı.');
      }
      setFlagsErr(null);
    } catch (e: any) {
      setFlagsErr(e.message);
      await dialog.alert({ title: 'Geçersiz JSON', message: 'Feature flags geçerli bir JSON object olmalı.', variant: 'error' });
      return;
    }

    // Bakım modu uyarısı
    if (s.maintenance_mode && !initial.maintenance_mode) {
      const ok = await dialog.confirm({
        title: 'Bakım modunu AÇIYORSUN',
        message: 'Tüm aktif kullanıcılar bakım ekranına düşecek. Devam edilsin mi?',
        confirmLabel: 'Bakımı Aç',
        danger: true,
      });
      if (!ok) return;
    }

    // Zorunlu güncelleme uyarısı
    if (s.force_update && !initial.force_update) {
      const ok = await dialog.confirm({
        title: 'Zorunlu güncelleme AÇIYORSUN',
        message: `Belirtilen sürümden (${s.min_supported_version || '—'}) eski APK çalıştıran tüm kullanıcılar engelleme ekranına düşecek.`,
        confirmLabel: 'Devam',
        danger: true,
      });
      if (!ok) return;
    }

    setSaving(true);
    try {
      const res = await fetch('/yonet/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          update: { ...s, feature_flags: parsedFlags },
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Kaydedilemedi');
      setS({ ...s, feature_flags: parsedFlags, updated_at: j.updated_at });
      setSavedNote(`Kaydedildi · ${new Date().toLocaleTimeString('tr-TR')}`);
      setTimeout(() => setSavedNote(null), 4000);
    } catch (e: any) {
      await dialog.alert({ title: 'Hata', message: e.message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setS(initial);
    setFlagsJson(JSON.stringify(initial.feature_flags || {}, null, 2));
    setFlagsErr(null);
  };

  const hasChange = JSON.stringify(s) !== JSON.stringify(initial)
    || flagsJson !== JSON.stringify(initial.feature_flags || {}, null, 2);

  return (
    <div className="space-y-5">
      {/* Üst durum + Kaydet butonu */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="text-xs text-slate-400">
          Son güncelleme:{' '}
          <span className="text-slate-200 font-mono">
            {new Date(s.updated_at).toLocaleString('tr-TR')}
          </span>
          {s.updated_by && <> · <span className="text-cyan-300">{s.updated_by}</span></>}
        </div>
        <div className="flex items-center gap-2">
          {savedNote && <span className="text-xs text-emerald-300">{savedNote}</span>}
          {hasChange && (
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-white/10 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" /> Geri Al
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChange}
            className="px-4 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-200 hover:bg-amber-500/30 disabled:opacity-40 text-xs font-bold flex items-center gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Kaydet
          </button>
        </div>
      </div>

      {/* 1) BAKIM MODU */}
      <Card icon={<Wrench className="w-4 h-4 text-amber-400" />} title="Bakım Modu" hint="Açıldığında tüm kullanıcılar bakım ekranı görür, uygulamayı kullanamazlar.">
        <Toggle
          label="Bakım modu aktif"
          checked={s.maintenance_mode}
          onChange={v => update('maintenance_mode', v)}
          danger
        />
        {s.maintenance_mode && (
          <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs text-red-200">
              <strong>UYARI:</strong> Bakım modu canlıdır — yeni açılan tüm uygulama oturumları bakım ekranına düşer.
            </div>
          </div>
        )}
        <Field label="Bakım Mesajı (kullanıcıya gösterilir)">
          <textarea
            value={s.maintenance_message}
            onChange={e => update('maintenance_message', e.target.value)}
            rows={2}
            placeholder="Uygulama bakımda. Lütfen birazdan tekrar deneyin."
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-slate-100 resize-y"
          />
        </Field>
        <Field label="Tahmini bitiş (opsiyonel)" hint="Örn. '21:30' veya '15 dakika içinde'">
          <input
            type="text"
            value={s.maintenance_eta || ''}
            onChange={e => update('maintenance_eta', e.target.value || null)}
            placeholder="21:30"
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-slate-100"
          />
        </Field>
      </Card>

      {/* 2) ZORUNLU GÜNCELLEME */}
      <Card icon={<Smartphone className="w-4 h-4 text-cyan-400" />} title="Zorunlu Güncelleme" hint="Belirtilen sürümden eski APK'lara güncelleme ekranı göster.">
        <Toggle
          label="Zorunlu güncelleme aktif"
          checked={s.force_update}
          onChange={v => update('force_update', v)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min. Desteklenen Sürüm" hint="Örn. 1.3.97 (app.json version)">
            <input
              type="text"
              value={s.min_supported_version || ''}
              onChange={e => update('min_supported_version', e.target.value || null)}
              placeholder="1.3.97"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-slate-100 font-mono"
            />
          </Field>
        </div>
        <Field label="Güncelleme Mesajı">
          <input
            type="text"
            value={s.force_update_message}
            onChange={e => update('force_update_message', e.target.value)}
            placeholder="Lütfen Play Store'dan güncelleyin."
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-slate-100"
          />
        </Field>
      </Card>

      {/* 3) BANNER */}
      <Card icon={<Megaphone className="w-4 h-4 text-violet-400" />} title="Üst Bildirim Banner'ı" hint="Tüm sayfalarda üstte ince bir bildirim çubuğu (örn. 'Yarın bakım var').">
        <Toggle
          label="Banner aktif"
          checked={s.banner_enabled}
          onChange={v => update('banner_enabled', v)}
        />
        <Field label="Banner Metni">
          <input
            type="text"
            value={s.banner_text}
            onChange={e => update('banner_text', e.target.value)}
            placeholder="Yarın 03:00'te 30 dakikalık bakım olacaktır."
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-slate-100"
          />
        </Field>
        <Field label="Önem Seviyesi">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(Object.keys(SEVERITY_META) as (keyof typeof SEVERITY_META)[]).map(k => (
              <button
                key={k}
                type="button"
                onClick={() => update('banner_severity', k as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                  s.banner_severity === k
                    ? 'border-2'
                    : 'opacity-50 hover:opacity-80'
                }`}
                style={{
                  background: SEVERITY_META[k].color + '15',
                  borderColor: SEVERITY_META[k].color + (s.banner_severity === k ? '80' : '30'),
                  color: SEVERITY_META[k].color,
                }}
              >
                {SEVERITY_META[k].label}
              </button>
            ))}
          </div>
        </Field>
      </Card>

      {/* 4) FEATURE FLAGS */}
      <Card icon={<ToggleRight className="w-4 h-4 text-emerald-400" />} title="Özellik Bayrakları" hint="APK'ya gönderilen flag JSON — kod tarafında okunur (örn. SHOW_GIF_TAB, ENABLE_VOICE_BIO).">
        <Field label="JSON" hint="Geçerli bir JSON object olmalı (key: value)">
          <textarea
            value={flagsJson}
            onChange={e => { setFlagsJson(e.target.value); setFlagsErr(null); }}
            rows={6}
            spellCheck={false}
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs text-slate-100 font-mono resize-y"
          />
          {flagsErr && <div className="text-[10px] text-red-300 mt-1">{flagsErr}</div>}
        </Field>
      </Card>
    </div>
  );
}

function Card({ icon, title, hint, children }: { icon: React.ReactNode; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
      <div>
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {hint && <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</label>
      {children}
      {hint && <div className="text-[10px] text-slate-500">{hint}</div>}
    </div>
  );
}

function Toggle({ label, checked, onChange, danger }: { label: string; checked: boolean; onChange: (v: boolean) => void; danger?: boolean }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full p-0.5 transition-colors ${
          checked
            ? danger ? 'bg-red-500/80' : 'bg-emerald-500/80'
            : 'bg-slate-700'
        }`}
      >
        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
      <span className={`text-xs font-medium ${checked && danger ? 'text-red-200' : 'text-slate-200'}`}>{label}</span>
    </label>
  );
}
