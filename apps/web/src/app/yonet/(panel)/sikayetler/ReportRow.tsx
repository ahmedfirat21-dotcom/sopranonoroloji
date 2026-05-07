"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Ban } from 'lucide-react';
import { useAdminDialog } from '../../_components/AdminDialog';

type Report = {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_room_id: string | null;
  reported_post_id: string | null;
  reported_message_id: string | null;
  reason: string;
  reason_label: string;
  description: string | null;
  status: string;
  created_at: string;
  reporter?: { display_name: string; avatar_url: string };
  reported_user?: { display_name: string; avatar_url: string } | null;
};

export default function ReportRow({ report }: { report: Report }) {
  const router = useRouter();
  const dialog = useAdminDialog();
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleAction = async (action: 'dismiss' | 'resolve' | 'ban') => {
    setBusy(action);
    try {
      const res = await fetch(`/yonet/api/reports/${report.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('İşlem başarısız');
      startTransition(() => router.refresh());
    } catch (e: any) {
      await dialog.alert({ title: 'Hata', message: e.message || 'Hata', variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const handleBanTarget = async () => {
    const ok = await dialog.confirm({
      title: 'Kullanıcıyı banla',
      message: 'Hedef kullanıcıyı banlamak istediğine emin misin? Bu işlem kullanıcının hesabını askıya alır.',
      confirmLabel: 'Banla',
      danger: true,
    });
    if (!ok) return;
    handleAction('ban');
  };

  const targetType = report.reported_user_id ? 'Kullanıcı'
    : report.reported_room_id ? 'Oda'
    : report.reported_message_id ? 'Mesaj'
    : report.reported_post_id ? 'Gönderi'
    : '—';

  const isPending = report.status === 'pending';

  return (
    <div className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-[10px] font-bold tracking-wider">
              {report.reason_label.toUpperCase()}
            </span>
            <span className="text-[10px] text-slate-500">
              {new Date(report.created_at).toLocaleString('tr-TR')}
            </span>
            <span className="text-[10px] text-slate-500">·</span>
            <span className="text-[10px] text-slate-400">{targetType}</span>
          </div>
          <div className="text-sm text-slate-200">
            <span className="text-slate-400">Bildiren:</span>{' '}
            <span className="font-semibold">{report.reporter?.display_name || '?'}</span>
            {' '}→{' '}
            <span className="text-slate-400">Hedef:</span>{' '}
            <span className="font-semibold text-amber-300">
              {report.reported_user?.display_name || (report.reported_user_id || '—')}
            </span>
          </div>
          {report.description && (
            <p className="mt-2 text-xs text-slate-400 italic">"{report.description}"</p>
          )}
        </div>

        {isPending ? (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleAction('dismiss')}
              disabled={!!busy}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              title="Geçersiz/yoksay"
            >
              <X className="w-3.5 h-3.5" /> Yoksay
            </button>
            <button
              onClick={() => handleAction('resolve')}
              disabled={!!busy}
              className="px-3 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs text-cyan-300 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              title="İncelendi/kapat"
            >
              <Check className="w-3.5 h-3.5" /> Çözüldü
            </button>
            {report.reported_user_id && (
              <button
                onClick={handleBanTarget}
                disabled={!!busy}
                className="px-3 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-xs text-red-300 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                title="Kullanıcıyı banla"
              >
                <Ban className="w-3.5 h-3.5" /> Banla
              </button>
            )}
          </div>
        ) : (
          <span className="px-2 py-1 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400 text-[10px] font-semibold">
            {report.status === 'resolved' ? 'ÇÖZÜLDÜ' : report.status.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}
