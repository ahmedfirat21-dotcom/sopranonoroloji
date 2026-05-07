"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Check, X, Banknote, Clock, AlertCircle, CreditCard, FileText } from 'lucide-react';
import { useAdminDialog } from '../../_components/AdminDialog';

type Profile = {
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  system_points: number;
  subscription_tier: string | null;
};

type Request = {
  id: string;
  user_id: string;
  amount: number;
  commission_rate: number;
  net_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  profiles: Profile | null;
};

type Tab = 'pending' | 'approved' | 'paid' | 'rejected' | 'all';

const TAB_LABELS: Record<Tab, string> = {
  pending: 'Bekleyen',
  approved: 'Onaylı',
  paid: 'Ödendi',
  rejected: 'Reddedildi',
  all: 'Tümü',
};

const STATUS_STYLE: Record<Request['status'], { bg: string; text: string; label: string; icon: any }> = {
  pending: { bg: 'bg-amber-500/15 border-amber-500/40', text: 'text-amber-300', label: 'BEKLİYOR', icon: Clock },
  approved: { bg: 'bg-cyan-500/15 border-cyan-500/40', text: 'text-cyan-300', label: 'ONAYLI', icon: Check },
  paid: { bg: 'bg-emerald-500/15 border-emerald-500/40', text: 'text-emerald-300', label: 'ÖDENDİ', icon: CreditCard },
  rejected: { bg: 'bg-red-500/15 border-red-500/40', text: 'text-red-300', label: 'REDDEDİLDİ', icon: X },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function CashoutClient({ initialRequests }: { initialRequests: Request[] }) {
  const router = useRouter();
  const dialog = useAdminDialog();
  const [requests, setRequests] = useState(initialRequests);
  const [tab, setTab] = useState<Tab>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = tab === 'all' ? requests : requests.filter((r) => r.status === tab);

  const counts: Record<Tab, number> = {
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    paid: requests.filter((r) => r.status === 'paid').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
    all: requests.length,
  };

  const updateStatus = async (req: Request, newStatus: Request['status'], promptForNote: boolean) => {
    let note = '';
    if (promptForNote) {
      const v = await dialog.prompt({
        title: `${req.profiles?.display_name || 'Kullanıcı'} — admin notu`,
        message: 'Bu istek için isteğe bağlı not (kullanıcıya gönderilebilir).',
        defaultValue: req.admin_note || '',
        multiline: true,
      });
      if (v === null) return;
      note = v;
    }

    setBusyId(req.id);
    try {
      const res = await fetch('/yonet/api/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: req.id, status: newStatus, admin_note: note || req.admin_note || '' }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'İşlem başarısız');
      }
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: newStatus, admin_note: note || r.admin_note, updated_at: new Date().toISOString() } : r))
      );
      startTransition(() => router.refresh());
    } catch (e: any) {
      await dialog.alert({ title: 'Hata', message: e.message, variant: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = async (req: Request) => {
    const ok = await dialog.confirm({
      title: 'İsteği onayla',
      message: `${req.profiles?.display_name} için ${req.amount.toLocaleString('tr-TR')} SP (net ₺${Number(req.net_amount).toLocaleString('tr-TR')}) çekim isteği ONAYLANSIN mı?`,
      confirmLabel: 'Onayla',
    });
    if (!ok) return;
    updateStatus(req, 'approved', true);
  };

  const handleReject = async (req: Request) => {
    const ok = await dialog.confirm({
      title: 'İsteği reddet',
      message: `${req.profiles?.display_name} için ${req.amount.toLocaleString('tr-TR')} SP çekim isteği REDDEDİLSİN mi? Sebep notunu girmen istenecek.`,
      confirmLabel: 'Reddet',
      danger: true,
    });
    if (!ok) return;
    updateStatus(req, 'rejected', true);
  };

  const handleMarkPaid = async (req: Request) => {
    const ok = await dialog.confirm({
      title: 'Ödendi olarak işaretle',
      message: `${req.profiles?.display_name} için net ₺${Number(req.net_amount).toLocaleString('tr-TR')} ödeme yapıldı olarak işaretlensin mi? Bu son adımdır.`,
      confirmLabel: 'Ödendi',
    });
    if (!ok) return;
    updateStatus(req, 'paid', false);
  };

  return (
    <div>
      {/* Tab seçici */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => {
          const active = tab === t;
          const count = counts[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                active
                  ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-200'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              {TAB_LABELS[t]}
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${active ? 'bg-emerald-500/30' : 'bg-white/10'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-slate-500 text-sm">
            Bu sekmede kayıt yok.
          </div>
        ) : (
          filtered.map((r) => {
            const style = STATUS_STYLE[r.status];
            const StatusIcon = style.icon;
            const isBusy = busyId === r.id;
            return (
              <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  {r.profiles?.avatar_url ? (
                    <Image src={r.profiles.avatar_url} alt={r.profiles.display_name} width={44} height={44} className="w-11 h-11 rounded-full object-cover bg-slate-700 shrink-0" unoptimized />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold shrink-0">
                      {(r.profiles?.display_name || '?').charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Bilgi */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <div className="font-bold text-slate-100 truncate">
                        {r.profiles?.display_name || 'Kullanıcı'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {r.profiles?.username ? `@${r.profiles.username}` : r.user_id.slice(0, 12) + '…'}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wider flex items-center gap-1 ${style.bg} ${style.text}`}>
                        <StatusIcon className="w-3 h-3" /> {style.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3">
                      <div className="bg-black/20 rounded-lg p-2">
                        <div className="text-[9px] text-slate-500 tracking-wider mb-0.5">İSTENEN</div>
                        <div className="text-sm font-mono font-bold text-amber-300">
                          {r.amount.toLocaleString('tr-TR')} SP
                        </div>
                      </div>
                      <div className="bg-black/20 rounded-lg p-2">
                        <div className="text-[9px] text-slate-500 tracking-wider mb-0.5">KOMİSYON</div>
                        <div className="text-sm font-mono text-slate-300">
                          %{(Number(r.commission_rate) * 100).toFixed(0)}
                        </div>
                      </div>
                      <div className="bg-black/20 rounded-lg p-2">
                        <div className="text-[9px] text-slate-500 tracking-wider mb-0.5">NET ÖDEME</div>
                        <div className="text-sm font-mono font-bold text-emerald-300">
                          ₺{Number(r.net_amount).toLocaleString('tr-TR')}
                        </div>
                      </div>
                      <div className="bg-black/20 rounded-lg p-2">
                        <div className="text-[9px] text-slate-500 tracking-wider mb-0.5">TARİH</div>
                        <div className="text-xs font-mono text-slate-300">
                          {formatDate(r.created_at)}
                        </div>
                      </div>
                    </div>

                    {r.admin_note && (
                      <div className="bg-white/[0.03] border border-white/10 rounded-lg p-2.5 mb-2 flex gap-2 text-xs text-slate-300">
                        <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[9px] text-slate-500 tracking-wider mb-0.5">ADMIN NOTU</div>
                          <div className="italic">{r.admin_note}</div>
                        </div>
                      </div>
                    )}

                    {/* User'ın anlık SP durumu — kontrol için */}
                    <div className="text-[10px] text-slate-500">
                      Kullanıcı bakiyesi şu an: <span className="text-amber-300 font-mono">{(r.profiles?.system_points ?? 0).toLocaleString('tr-TR')} SP</span>
                      {r.profiles?.subscription_tier && r.profiles.subscription_tier !== 'Free' && (
                        <> · <span className="text-cyan-300 font-bold">{r.profiles.subscription_tier}</span></>
                      )}
                    </div>
                  </div>
                </div>

                {/* Aksiyon butonları */}
                {r.status === 'pending' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => handleApprove(r)}
                      disabled={isBusy}
                      className="flex-1 px-3 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-200 text-xs font-bold hover:bg-cyan-500/25 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Onayla
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(r)}
                      disabled={isBusy}
                      className="flex-1 px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/40 text-red-200 text-xs font-bold hover:bg-red-500/25 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Reddet
                    </button>
                  </div>
                )}
                {r.status === 'approved' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => handleMarkPaid(r)}
                      disabled={isBusy}
                      className="flex-1 px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs font-bold hover:bg-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                      Ödendi olarak işaretle
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
