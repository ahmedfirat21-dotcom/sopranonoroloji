"use client";

import { useState } from 'react';
import { Lock, Loader2, Copy, Check, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useAdminDialog } from '../../_components/AdminDialog';

export default function PasswordChangeForm() {
  const dialog = useAdminDialog();
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ hash: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!oldPwd) { setFormError('Mevcut şifreyi gir'); return; }
    if (newPwd.length < 8) { setFormError('Yeni şifre en az 8 karakter olmalı'); return; }
    if (newPwd !== confirmPwd) { setFormError('Yeni şifre onayı eşleşmiyor'); return; }

    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/yonet/api/sifre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old: oldPwd, new: newPwd }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'İşlem başarısız');
      setResult({ hash: j.hash });
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (e: any) {
      await dialog.alert({ title: 'Hata', message: e.message, variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const copyHash = async () => {
    if (!result?.hash) return;
    try {
      await navigator.clipboard.writeText(result.hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await dialog.alert({ title: 'Kopyalama başarısız', message: 'Manuel olarak seçip Ctrl+C ile kopyala.', variant: 'error' });
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <h2 className="text-sm font-bold tracking-wider text-slate-300 mb-1 flex items-center gap-2">
        <Lock className="w-4 h-4 text-cyan-400" /> ŞİFRE DEĞİŞTİR
      </h2>
      <p className="text-xs text-slate-500 mb-5">
        Yeni şifre için bir scrypt hash üretilir. Onu .env.local + Vercel env'e koy + redeploy et.
      </p>

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-semibold tracking-wider mb-1 text-slate-400">MEVCUT ŞİFRE</label>
            <input
              type="password"
              value={oldPwd}
              onChange={e => setOldPwd(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-cyan-500/50 focus:outline-none text-sm"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold tracking-wider mb-1 text-slate-400">YENİ ŞİFRE (en az 8 karakter)</label>
            <input
              type="password"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-cyan-500/50 focus:outline-none text-sm"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold tracking-wider mb-1 text-slate-400">YENİ ŞİFRE (TEKRAR)</label>
            <input
              type="password"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-cyan-500/50 focus:outline-none text-sm"
              autoComplete="new-password"
            />
          </div>
          {formError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              {formError}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full px-4 py-3 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-200 text-sm font-semibold hover:bg-cyan-500/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Hash Üret
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <h3 className="text-sm font-bold text-emerald-300 mb-2">✓ Hash üretildi</h3>
            <p className="text-xs text-slate-300">
              Aşağıdaki hash'i kopyala ve <strong>iki yere</strong> koy:
            </p>
            <ol className="text-xs text-slate-300 list-decimal pl-5 mt-2 space-y-1">
              <li><code className="bg-black/40 px-1 rounded">.env.local</code> içinde <code className="bg-black/40 px-1 rounded">ADMIN_PASSWORD_HASH="..."</code> satırı</li>
              <li>Vercel → Settings → Environment Variables → <code className="bg-black/40 px-1 rounded">ADMIN_PASSWORD_HASH</code></li>
            </ol>
            <p className="text-xs text-slate-400 mt-2">
              Kaydedince Vercel'de <strong>Redeploy</strong>; lokalde dev server'ı yeniden başlat.
              Yeni şifre aktif olur. Tüm eski oturumlar otomatik düşer.
            </p>
          </div>

          <div className="relative">
            <code className="block bg-black/40 border border-white/10 rounded-lg p-3 text-[11px] font-mono break-all text-slate-200">
              {result.hash}
            </code>
            <button
              type="button"
              onClick={copyHash}
              className="absolute top-2 right-2 px-2 py-1 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-xs font-semibold hover:bg-cyan-500/30 flex items-center gap-1"
            >
              {copied ? <><Check className="w-3 h-3" /> Kopyalandı</> : <><Copy className="w-3 h-3" /> Kopyala</>}
            </button>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200/80 flex gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <div>
              Hash'i kimseye gösterme. Üretildiği anda kopyala — bu sayfayı kapatınca tekrar göremezsin.
            </div>
          </div>

          <button
            type="button"
            onClick={() => setResult(null)}
            className="text-xs text-slate-400 hover:text-slate-200 underline"
          >
            Yeni hash üret
          </button>
        </div>
      )}
    </div>
  );
}
