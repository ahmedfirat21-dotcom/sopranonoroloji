"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, Lock, Power, Globe, Mic, Loader2, Trash2, Play, Crown } from 'lucide-react';
import { useAdminDialog } from '../../_components/AdminDialog';

type Room = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  type: string | null;
  host_id: string | null;
  is_live: boolean | null;
  listener_count: number | null;
  max_speakers: number | null;
  language: string | null;
  mode: string | null;
  is_locked: boolean | null;
  is_persistent: boolean | null;
  total_gifts: number | null;
  created_at: string;
  expires_at: string | null;
  room_image_url: string | null;
  host?: { display_name: string; avatar_url: string } | null;
};

type Tab = 'live' | 'closed';

export default function RoomsClient({
  liveRooms,
  closedRooms,
}: {
  liveRooms: Room[];
  closedRooms: Room[];
}) {
  const router = useRouter();
  const dialog = useAdminDialog();
  const [tab, setTab] = useState<Tab>('live');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const callAction = async (id: string, payload: { action: string; tier?: string }) => {
    setBusyId(id);
    try {
      const res = await fetch(`/yonet/api/rooms/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'İşlem başarısız');
      }
      startTransition(() => router.refresh());
    } catch (e: any) {
      await dialog.alert({ title: 'Hata', message: e.message, variant: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const handleClose = async (r: Room) => {
    const ok = await dialog.confirm({
      title: 'Odayı kapat',
      message: `"${r.name}" zorla kapatılsın mı?`,
      confirmLabel: 'Kapat',
      danger: true,
    });
    if (!ok) return;
    callAction(r.id, { action: 'close' });
  };

  const handleWake = async (r: Room) => {
    const ok = await dialog.confirm({
      title: 'Odayı uyandır',
      message: `"${r.name}" uyandırılsın mı? Tekrar canlıya alınır.`,
      confirmLabel: 'Uyandır',
    });
    if (!ok) return;
    callAction(r.id, { action: 'wake' });
  };

  const handleTierChange = async (r: Room) => {
    const t = await dialog.prompt({
      title: `${r.name} — Tier ata`,
      message: 'Free / Plus / Pro değerlerinden birini gir.',
      defaultValue: 'Plus',
      placeholder: 'Plus',
    });
    if (!t) return;
    if (!['Free', 'Plus', 'Pro'].includes(t.trim())) {
      await dialog.alert({ title: 'Geçersiz tier', message: 'Sadece Free, Plus veya Pro.', variant: 'error' });
      return;
    }
    callAction(r.id, { action: 'change_tier', tier: t.trim() });
  };

  const handleDelete = async (r: Room) => {
    const first = await dialog.confirm({
      title: `"${r.name}" kalıcı silinecek`,
      message: 'Oda + katılımcılar + mesajlar silinecek. Geri alınamaz.',
      confirmLabel: 'Devam',
      danger: true,
    });
    if (!first) return;
    const second = await dialog.confirm({
      title: 'Son onay',
      message: `"${r.name}" silinecek. Emin misin?`,
      confirmLabel: 'Sil',
      danger: true,
    });
    if (!second) return;
    callAction(r.id, { action: 'delete' });
  };

  const list = tab === 'live' ? liveRooms : closedRooms;

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => setTab('live')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
            tab === 'live'
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200'
              : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
          }`}
        >
          <Radio className="w-4 h-4" /> Canlı ({liveRooms.length})
        </button>
        <button
          onClick={() => setTab('closed')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'closed'
              ? 'bg-slate-500/20 border border-slate-500/40 text-slate-200'
              : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
          }`}
        >
          Kapalı ({closedRooms.length})
        </button>
      </div>

      {/* Mobile: kart layout */}
      <div className="lg:hidden space-y-3">
        {list.map(r => {
          const isBusy = busyId === r.id;
          return (
            <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                {r.room_image_url ? (
                  <img src={r.room_image_url} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                    <Mic className="w-5 h-5 text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-100 truncate flex items-center gap-1.5">
                    {r.name}
                    {r.is_locked && <Lock className="w-3 h-3 text-amber-400" />}
                    {r.is_persistent && <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30">KORO</span>}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {r.host?.display_name || (r.host_id ? r.host_id.slice(0, 8) + '…' : '—')}
                  </div>
                </div>
                {r.is_live ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold inline-flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> CANLI
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400 text-[10px] font-bold shrink-0">KAPALI</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-3">
                <span className="inline-flex items-center gap-1"><Globe className="w-3 h-3" /> {r.language || 'tr'}</span>
                <span>· {r.category || '—'}</span>
                <span className="ml-auto text-cyan-300">{r.listener_count ?? 0} dinleyici</span>
                <span className="text-amber-300">{(r.total_gifts ?? 0).toLocaleString('tr-TR')} SP</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {r.is_live ? (
                  <button
                    type="button"
                    onClick={() => handleClose(r)}
                    disabled={isBusy}
                    className="px-2 py-2 rounded-md text-[10px] font-semibold border bg-amber-500/10 border-amber-500/30 text-amber-300 flex items-center justify-center gap-1"
                  >
                    {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3 h-3" />} KAPAT
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleWake(r)}
                    disabled={isBusy}
                    className="px-2 py-2 rounded-md text-[10px] font-semibold border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 flex items-center justify-center gap-1"
                  >
                    {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} UYAN
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleTierChange(r)}
                  disabled={isBusy}
                  className="px-2 py-2 rounded-md text-[10px] font-semibold border bg-amber-500/10 border-amber-500/30 text-amber-300 flex items-center justify-center gap-1"
                >
                  <Crown className="w-3 h-3" /> TIER
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(r)}
                  disabled={isBusy}
                  className="px-2 py-2 rounded-md text-[10px] font-semibold border bg-red-500/15 border-red-500/40 text-red-200 flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> SİL
                </button>
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-slate-500 text-sm">
            {tab === 'live' ? 'Şu an canlı oda yok.' : 'Kapalı oda kaydı yok.'}
          </div>
        )}
      </div>

      {/* Desktop: tablo */}
      <div className="hidden lg:block bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] text-[10px] tracking-wider text-slate-400">
              <tr>
                <th className="text-left px-5 py-3">ODA</th>
                <th className="text-left px-3 py-3">SAHİBİ</th>
                <th className="text-left px-3 py-3">DİL</th>
                <th className="text-right px-3 py-3">DİNLEYİCİ</th>
                <th className="text-right px-3 py-3">SP</th>
                <th className="text-center px-3 py-3">DURUM</th>
                <th className="text-right px-5 py-3">AKSİYONLAR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {list.map(r => {
                const isBusy = busyId === r.id;
                return (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {r.room_image_url ? (
                          <img src={r.room_image_url} alt="" className="w-9 h-9 rounded-lg object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">
                            <Mic className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-100 truncate flex items-center gap-1.5">
                            {r.name}
                            {r.is_locked && <Lock className="w-3 h-3 text-amber-400" />}
                            {r.is_persistent && <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30">KORO</span>}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{r.category} · {r.mode || r.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-300">
                      {r.host?.display_name || (r.host_id ? r.host_id.slice(0, 8) + '…' : '—')}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {r.language || 'tr'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-cyan-300 font-mono text-xs">
                      {r.listener_count ?? 0}
                    </td>
                    <td className="px-3 py-3 text-right text-amber-300 font-mono text-xs">
                      {(r.total_gifts ?? 0).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {r.is_live ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> CANLI
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400 text-[10px] font-bold">KAPALI</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {r.is_live ? (
                          <button
                            type="button"
                            onClick={() => handleClose(r)}
                            disabled={isBusy}
                            className="px-2 py-1.5 rounded-md text-[10px] font-semibold border bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors flex items-center gap-1"
                            title="Odayı kapat"
                          >
                            {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3 h-3" />}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleWake(r)}
                            disabled={isBusy}
                            className="px-2 py-1.5 rounded-md text-[10px] font-semibold border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                            title="Odayı uyandır"
                          >
                            {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                          </button>
                        )}
                        {/* Tier değiştir */}
                        <button
                          type="button"
                          onClick={() => handleTierChange(r)}
                          disabled={isBusy}
                          className="px-2 py-1.5 rounded-md text-[10px] font-semibold border bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors flex items-center gap-1"
                          title="Tier değiştir"
                        >
                          <Crown className="w-3 h-3" />
                        </button>
                        {/* Kalıcı sil — cascade */}
                        <button
                          type="button"
                          onClick={() => handleDelete(r)}
                          disabled={isBusy}
                          className="px-2 py-1.5 rounded-md text-[10px] font-semibold border bg-red-500/15 border-red-500/40 text-red-200 hover:bg-red-500/25 transition-colors flex items-center gap-1"
                          title="Odayı kalıcı sil"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500 text-sm">
                    {tab === 'live' ? 'Şu an canlı oda yok.' : 'Kapalı oda kaydı yok.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
