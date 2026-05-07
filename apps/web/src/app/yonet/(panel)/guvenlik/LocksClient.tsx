"use client";

import { useEffect, useState } from 'react';
import { Loader2, Lock, Unlock, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAdminDialog } from '../../_components/AdminDialog';

type LockEntry = {
  ip: string;
  fails: number;
  locked: boolean;
  remainingMs: number;
};

function formatRemaining(ms: number): string {
  if (ms <= 0) return '—';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (m > 0) return `${m} dk ${s} sn`;
  return `${s} sn`;
}

export default function LocksClient() {
  const dialog = useAdminDialog();
  const [locks, setLocks] = useState<LockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyIp, setBusyIp] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/yonet/api/locks');
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Yükleme hatası');
      setLocks(j.locks || []);
    } catch (e: any) {
      await dialog.alert({ title: 'Hata', message: e.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Otomatik yenile (kilit süresi geri saymak için)
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClear = async (ip: string) => {
    const ok = await dialog.confirm({
      title: 'Kilidi kaldır',
      message: `${ip} adresinin kilidi kaldırılacak ve fail sayacı sıfırlanacak.`,
      confirmLabel: 'Kaldır',
    });
    if (!ok) return;
    setBusyIp(ip);
    try {
      const res = await fetch(`/yonet/api/locks?ip=${encodeURIComponent(ip)}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'İşlem başarısız');
      }
      setLocks(prev => prev.filter(l => l.ip !== ip));
    } catch (e: any) {
      await dialog.alert({ title: 'Hata', message: e.message, variant: 'error' });
    } finally {
      setBusyIp(null);
    }
  };

  const lockedCount = locks.filter(l => l.locked).length;
  const failCount = locks.length;

  return (
    <div className="space-y-4">
      {/* Bilgi kartı */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-200/80 flex gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-200">Önemli:</strong> Kilitler sunucu belleğinde tutulur — Vercel
          kendini yeniden başlattığında otomatik sıfırlanır. Kendi IP'n yanlışlıkla kilitlendiyse buradan
          açabilirsin (başka cihazdan giriş yaparak).
        </div>
      </div>

      {/* Üst toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 flex items-center gap-3 flex-wrap">
          <span className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold">
            {lockedCount} kilitli
          </span>
          <span className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
            {failCount - lockedCount} izlemede
          </span>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Yenile
        </button>
      </div>

      {/* Liste */}
      {loading && locks.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500 mx-auto" />
        </div>
      ) : locks.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-slate-500 text-sm">
          Şu an izlenen IP yok.
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] text-[10px] tracking-wider text-slate-400">
              <tr>
                <th className="text-left px-5 py-3">IP ADRESİ</th>
                <th className="text-center px-3 py-3">YANLIŞ DENEME</th>
                <th className="text-center px-3 py-3">DURUM</th>
                <th className="text-right px-3 py-3">KALAN SÜRE</th>
                <th className="text-right px-5 py-3">İŞLEM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {locks.map(l => (
                <tr key={l.ip} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3 font-mono text-xs text-slate-200">{l.ip}</td>
                  <td className="px-3 py-3 text-center text-amber-300 font-mono">{l.fails}</td>
                  <td className="px-3 py-3 text-center">
                    {l.locked ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/40 text-red-300 text-[10px] font-bold inline-flex items-center gap-1">
                        <Lock className="w-3 h-3" /> KİLİTLİ
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                        İZLENİYOR
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-xs text-slate-300">
                    {formatRemaining(l.remainingMs)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleClear(l.ip)}
                      disabled={busyIp === l.ip}
                      className="px-3 py-1.5 rounded-md text-[10px] font-semibold border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors flex items-center gap-1 ml-auto"
                    >
                      {busyIp === l.ip ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlock className="w-3 h-3" />}
                      Kilidi Aç
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
