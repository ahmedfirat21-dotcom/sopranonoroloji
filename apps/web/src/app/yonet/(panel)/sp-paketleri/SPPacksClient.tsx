"use client";

/**
 * SP Paketleri yönetimi — liste + create/edit modal.
 * sp_packages tablosu için tam CRUD UI.
 */
import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Star, Loader2, X, Eye, EyeOff } from 'lucide-react';
import { useAdminDialog } from '../../_components/AdminDialog';

type SPPack = {
  id: string;
  tier_name: string;
  tier_key: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | string;
  tier_color: string;
  sp_amount: number;
  bonus_sp: number | null;
  bonus_pct: number | null;
  price_try: number;
  fiat_label: string | null;
  popular: boolean | null;
  sort_order: number | null;
  is_active: boolean | null;
};

const TIER_DEFAULTS: Record<string, { name: string; color: string }> = {
  bronze:   { name: 'Bronz',   color: '#cd7f32' },
  silver:   { name: 'Gümüş',   color: '#c0c0c0' },
  gold:     { name: 'Altın',   color: '#ffd700' },
  platinum: { name: 'Platin',  color: '#e5e4e2' },
  diamond:  { name: 'Elmas',   color: '#b9f2ff' },
};

export default function SPPacksClient({ initialPacks }: { initialPacks: SPPack[] }) {
  const router = useRouter();
  const dialog = useAdminDialog();
  const [packs, setPacks] = useState(initialPacks);
  const [editing, setEditing] = useState<SPPack | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const callAction = async (id: string, body: any) => {
    setBusyId(id);
    try {
      const res = await fetch(`/yonet/api/sp-packages/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'İşlem başarısız');
      if (body.delete) {
        setPacks(prev => prev.filter(p => p.id !== id));
      } else if (body.update) {
        setPacks(prev => prev.map(p => p.id === id ? { ...p, ...body.update } : p));
      }
      startTransition(() => router.refresh());
    } catch (e: any) {
      await dialog.alert({ title: 'Hata', message: e.message, variant: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (pack: SPPack) => {
    const ok = await dialog.confirm({
      title: `"${pack.tier_name}" silinecek`,
      message: 'Bu SP paketi APK mağazasından kaldırılacak. Önceki satın alımlar etkilenmez.',
      confirmLabel: 'Sil',
      danger: true,
    });
    if (!ok) return;
    callAction(pack.id, { delete: true });
  };

  return (
    <div>
      <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs">
        <span className="text-base shrink-0">💎</span>
        <div className="text-amber-100/90 leading-relaxed">
          <strong className="text-amber-200">SP Paketleri kullanıcı gerçek para ile satın alır</strong>{' '}
          (TRY). APK mağazasının "SP Paketleri" sekmesinde kart olarak listelenir. Bonus SP ile cazibe arttırılır.
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-400">{packs.length} paket</p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-200 hover:bg-amber-500/30 text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Yeni Paket
        </button>
      </div>

      {/* Liste */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {packs.map(pack => {
          const isBusy = busyId === pack.id;
          const bonusTotal = (pack.bonus_sp || 0);
          return (
            <div
              key={pack.id}
              className="rounded-2xl border bg-white/5 p-4 relative"
              style={{ borderColor: `${pack.tier_color}40` }}
            >
              {pack.popular && (
                <div className="absolute -top-2 left-4 px-2 py-0.5 rounded-full bg-amber-500/95 text-[9px] font-bold text-amber-950 flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-current" /> POPÜLER
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${pack.tier_color}cc, ${pack.tier_color}66)`,
                    boxShadow: `0 0 20px ${pack.tier_color}40`,
                  }}
                >
                  💎
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-100 truncate">{pack.tier_name}</div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: pack.tier_color }}>
                    {pack.tier_key}
                  </div>
                </div>
                {pack.is_active ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[9px] font-bold">AKTİF</span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400 text-[9px] font-bold">PASİF</span>
                )}
              </div>

              <div className="space-y-1 mb-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">SP miktarı:</span>
                  <span className="text-amber-300 font-mono font-bold">{pack.sp_amount.toLocaleString('tr-TR')}</span>
                </div>
                {bonusTotal > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Bonus:</span>
                    <span className="text-emerald-300 font-mono">+{bonusTotal.toLocaleString('tr-TR')}{pack.bonus_pct ? ` (%${pack.bonus_pct})` : ''}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Fiyat:</span>
                  <span className="text-slate-100 font-mono font-bold">
                    {pack.fiat_label || `${pack.price_try.toLocaleString('tr-TR')} ₺`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => callAction(pack.id, { update: { is_active: !pack.is_active } })}
                  disabled={isBusy}
                  className="flex-1 px-2 py-1.5 rounded-md text-[10px] font-semibold border bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
                  title={pack.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                >
                  {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : (pack.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />)}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(pack)}
                  disabled={isBusy}
                  className="flex-1 px-2 py-1.5 rounded-md text-[10px] font-semibold border bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-colors flex items-center justify-center gap-1"
                >
                  <Pencil className="w-3 h-3" /> Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(pack)}
                  disabled={isBusy}
                  className="px-2 py-1.5 rounded-md text-[10px] font-semibold border bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20 transition-colors flex items-center justify-center"
                  aria-label="Sil"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        {packs.length === 0 && (
          <div className="col-span-full bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <div className="text-slate-500 text-sm mb-3">Henüz SP paketi yok.</div>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-200 text-sm font-bold hover:bg-amber-500/30 transition-colors"
            >
              <Plus className="w-4 h-4" /> İlk paketi ekle
            </button>
          </div>
        )}
      </div>

      {(editing || creating) && (
        <SPPackModal
          pack={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={(saved, isNew) => {
            if (isNew) setPacks(prev => [...prev, saved].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)));
            else setPacks(prev => prev.map(p => p.id === saved.id ? saved : p));
            setEditing(null);
            setCreating(false);
            startTransition(() => router.refresh());
          }}
        />
      )}
    </div>
  );
}

function SPPackModal({
  pack,
  onClose,
  onSaved,
}: {
  pack: SPPack | null;
  onClose: () => void;
  onSaved: (saved: SPPack, isNew: boolean) => void;
}) {
  const dialog = useAdminDialog();
  const isNew = !pack;
  const [form, setForm] = useState<Partial<SPPack>>(
    pack || {
      id: '',
      tier_name: '',
      tier_key: 'bronze',
      tier_color: '#cd7f32',
      sp_amount: 1000,
      bonus_sp: 0,
      bonus_pct: 0,
      price_try: 49.99,
      fiat_label: '',
      popular: false,
      sort_order: 0,
      is_active: true,
    },
  );
  const [saving, setSaving] = useState(false);

  // tier_key değişince varsayılan isim ve renk doldurulur (sadece yeni paket için)
  const applyTierDefaults = (key: string) => {
    const def = TIER_DEFAULTS[key];
    if (def && isNew) {
      setForm(prev => ({
        ...prev,
        tier_key: key as any,
        tier_name: prev.tier_name || def.name,
        tier_color: prev.tier_color === '#cd7f32' || !prev.tier_color ? def.color : prev.tier_color,
      }));
    } else {
      setForm(prev => ({ ...prev, tier_key: key as any }));
    }
  };

  const handleSave = async () => {
    if (!form.tier_name?.trim()) {
      await dialog.alert({ title: 'Geçersiz', message: 'Paket adı boş olamaz.', variant: 'error' });
      return;
    }
    if (!form.sp_amount || form.sp_amount < 1) {
      await dialog.alert({ title: 'Geçersiz', message: 'SP miktarı 1 veya daha büyük olmalı.', variant: 'error' });
      return;
    }
    if (!form.price_try || form.price_try < 0.01) {
      await dialog.alert({ title: 'Geçersiz', message: 'Fiyat 0.01 veya daha büyük olmalı.', variant: 'error' });
      return;
    }

    setSaving(true);
    try {
      const url = isNew
        ? '/yonet/api/sp-packages'
        : `/yonet/api/sp-packages/${encodeURIComponent(pack!.id)}`;
      const method = 'POST';
      const body = isNew ? { create: form } : { update: form };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Kaydedilemedi');
      onSaved(j.pack, isNew);
    } catch (e: any) {
      await dialog.alert({ title: 'Hata', message: e.message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100">{isNew ? 'Yeni SP Paketi' : 'SP Paketi Düzenle'}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Tier seçimi */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Seviye</label>
            <div className="grid grid-cols-5 gap-1.5">
              {(['bronze','silver','gold','platinum','diamond'] as const).map(k => {
                const def = TIER_DEFAULTS[k];
                const active = form.tier_key === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => applyTierDefaults(k)}
                    className={`px-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                      active ? 'border-amber-500/60 bg-amber-500/15 text-amber-200' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                    style={active ? { borderColor: def.color, color: def.color } : {}}
                  >
                    {def.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* İsim */}
          <Field label="Paket Adı (kullanıcıya gözükür)">
            <input
              type="text"
              value={form.tier_name || ''}
              onChange={e => setForm(p => ({ ...p, tier_name: e.target.value }))}
              placeholder="örn. Altın Avcı"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-slate-100"
            />
          </Field>

          {/* Renk */}
          <Field label="Tema Rengi (gradient + glow)">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.tier_color || '#cd7f32'}
                onChange={e => setForm(p => ({ ...p, tier_color: e.target.value }))}
                className="w-10 h-10 rounded-lg bg-black/30 border border-white/10 cursor-pointer"
              />
              <input
                type="text"
                value={form.tier_color || ''}
                onChange={e => setForm(p => ({ ...p, tier_color: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-slate-100 font-mono"
              />
            </div>
          </Field>

          {/* SP miktarı */}
          <Field label="SP Miktarı (kullanıcıya verilen)">
            <input
              type="number"
              min={1}
              value={form.sp_amount ?? 0}
              onChange={e => setForm(p => ({ ...p, sp_amount: parseInt(e.target.value, 10) || 0 }))}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-slate-100 font-mono"
            />
          </Field>

          {/* Bonus SP */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bonus SP">
              <input
                type="number"
                min={0}
                value={form.bonus_sp ?? 0}
                onChange={e => setForm(p => ({ ...p, bonus_sp: parseInt(e.target.value, 10) || 0 }))}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-slate-100 font-mono"
              />
            </Field>
            <Field label="Bonus %">
              <input
                type="number"
                min={0}
                max={100}
                value={form.bonus_pct ?? 0}
                onChange={e => setForm(p => ({ ...p, bonus_pct: parseInt(e.target.value, 10) || 0 }))}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-slate-100 font-mono"
              />
            </Field>
          </div>

          {/* Fiyat */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fiyat (TRY)">
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={form.price_try ?? 0}
                onChange={e => setForm(p => ({ ...p, price_try: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-slate-100 font-mono"
              />
            </Field>
            <Field label="Görünür Etiket (örn. ₺49.99)">
              <input
                type="text"
                value={form.fiat_label || ''}
                onChange={e => setForm(p => ({ ...p, fiat_label: e.target.value }))}
                placeholder="₺49.99"
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-slate-100"
              />
            </Field>
          </div>

          {/* Sort + bayraklar */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sıralama (küçük üstte)">
              <input
                type="number"
                value={form.sort_order ?? 0}
                onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value, 10) || 0 }))}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-slate-100 font-mono"
              />
            </Field>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 px-3 py-2 rounded-lg bg-black/20 border border-white/10 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={!!form.popular}
                  onChange={e => setForm(p => ({ ...p, popular: e.target.checked }))}
                />
                <Star className="w-3 h-3 text-amber-400" /> Popüler
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 px-3 py-2 rounded-lg bg-black/20 border border-white/10 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={form.is_active !== false}
                  onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                />
                Aktif
              </label>
            </div>
          </div>

          {/* ID (sadece yeni paket için, otomatik üretilir backend'de — kullanıcı isterse manuel) */}
          {!isNew && (
            <div className="text-[10px] text-slate-500 font-mono">ID: {pack!.id}</div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/10 bg-black/20 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-white/10"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-200 hover:bg-amber-500/30 text-sm font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isNew ? 'Oluştur' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
