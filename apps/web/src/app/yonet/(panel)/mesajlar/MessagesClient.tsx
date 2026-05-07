"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { useAdminDialog } from '../../_components/AdminDialog';

type Profile = { display_name: string; avatar_url: string };

type Message = {
  id: string;
  sender_id: string;
  receiver_id?: string | null;
  content: string | null;
  room_id?: string | null;
  voice_url?: string | null;
  image_url?: string | null;
  type?: string | null;
  is_deleted: boolean | null;
  created_at: string;
  sender?: Profile | null;
};

type Report = {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_message_id: string | null;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  message: Message | null;
  reporter: Profile | null;
  reported_user: Profile | null;
};

type Tab = 'reported' | 'recent';

const REASON_LABEL_TR: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Taciz',
  hate_speech: 'Nefret söylemi',
  inappropriate_content: 'Uygunsuz içerik',
  impersonation: 'Kimliğe bürünme',
  self_harm: 'Kendine zarar',
  violence: 'Şiddet',
  underage: 'Yaş altı',
  other: 'Diğer',
};
const STATUS_LABEL_TR: Record<string, string> = {
  pending: 'Bekliyor',
  dismissed: 'Yoksayıldı',
  resolved: 'Çözüldü',
};

export default function MessagesClient({
  reportedMessages,
  recentMessages,
}: {
  reportedMessages: Report[];
  recentMessages: Message[];
}) {
  const router = useRouter();
  const dialog = useAdminDialog();
  const [tab, setTab] = useState<Tab>('reported');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const callDelete = async (messageId: string) => {
    setBusyId(messageId);
    try {
      const res = await fetch(`/yonet/api/messages/${messageId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'soft_delete' }),
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

  const handleDeleteMessage = async (messageId: string) => {
    const ok = await dialog.confirm({
      title: 'Mesajı sil',
      message: 'Bu mesaj kullanıcılara "silinmiş" olarak gösterilecek. Devam edilsin mi?',
      confirmLabel: 'Sil',
      danger: true,
    });
    if (!ok) return;
    callDelete(messageId);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <button
          type="button"
          onClick={() => setTab('reported')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'reported'
              ? 'bg-red-500/20 border border-red-500/40 text-red-200'
              : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
          }`}
        >
          Şikayet Edilen ({reportedMessages.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('recent')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'recent'
              ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200'
              : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
          }`}
        >
          Son Oda Mesajları ({recentMessages.length})
        </button>
      </div>

      {tab === 'reported' && (
        <div className="space-y-3">
          {reportedMessages.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-slate-500 text-sm">
              Şikayet edilen mesaj yok.
            </div>
          ) : reportedMessages.map(r => (
            <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-[10px] font-bold tracking-wider">
                      {(REASON_LABEL_TR[r.reason] || r.reason).toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(r.created_at).toLocaleString('tr-TR')}
                    </span>
                    <span className="text-[10px] text-slate-500">·</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.status === 'pending'
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                        : 'bg-slate-500/10 border border-slate-500/30 text-slate-400'
                    }`}>
                      {(STATUS_LABEL_TR[r.status] || r.status).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mb-2">
                    Bildiren: <span className="text-slate-200 font-semibold">{r.reporter?.display_name || '?'}</span>
                    {' · '}
                    Hedef: <span className="text-amber-300 font-semibold">{r.reported_user?.display_name || '?'}</span>
                  </div>

                  {r.message ? (
                    <div className="bg-black/30 border border-white/5 rounded-xl p-3 mb-2">
                      {r.message.is_deleted ? (
                        <div className="text-xs text-slate-500 italic">[Mesaj silinmiş]</div>
                      ) : (
                        <>
                          {r.message.content && (
                            <div className="text-sm text-slate-200 whitespace-pre-wrap break-words">
                              {r.message.content}
                            </div>
                          )}
                          {r.message.voice_url && (
                            <div className="flex items-center gap-2 text-xs text-cyan-300 mt-1">
                              <Mic className="w-3 h-3" />
                              <a href={r.message.voice_url} target="_blank" rel="noreferrer" className="underline">
                                Sesli mesaj (aç)
                              </a>
                            </div>
                          )}
                          {r.message.image_url && (
                            <div className="mt-2">
                              <img src={r.message.image_url} alt="" className="max-w-xs rounded-lg" />
                            </div>
                          )}
                        </>
                      )}
                      <div className="text-[10px] text-slate-600 mt-1">
                        {r.message.room_id ? 'Oda mesajı' : 'DM'} · {new Date(r.message.created_at).toLocaleString('tr-TR')}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600 italic">Mesaj bulunamadı (silinmiş olabilir)</div>
                  )}

                  {r.description && (
                    <p className="mt-2 text-xs text-slate-400 italic">"{r.description}"</p>
                  )}
                </div>

                {r.message && !r.message.is_deleted && (
                  <button
                    type="button"
                    onClick={() => handleDeleteMessage(r.message!.id)}
                    disabled={busyId === r.message.id}
                    className="px-3 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-xs text-red-300 disabled:opacity-50 flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    {busyId === r.message.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Mesajı Sil
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'recent' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/5">
            {recentMessages.map(m => (
              <div key={m.id} className="px-5 py-3 hover:bg-white/[0.02] flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0">
                  {(m.sender?.display_name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-slate-200">{m.sender?.display_name || m.sender_id.slice(0, 8)}</span>
                    <span className="text-[10px] text-slate-500">{new Date(m.created_at).toLocaleString('tr-TR')}</span>
                    {m.voice_url && <Mic className="w-3 h-3 text-cyan-400" />}
                    {m.image_url && <ImageIcon className="w-3 h-3 text-violet-400" />}
                  </div>
                  <div className="text-sm text-slate-300 truncate">
                    {m.content || (m.voice_url ? '[Sesli mesaj]' : m.image_url ? '[Görsel]' : '[Boş]')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteMessage(m.id)}
                  disabled={busyId === m.id}
                  className="px-2 py-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 disabled:opacity-50 transition-colors shrink-0"
                  title="Sil"
                >
                  {busyId === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
            {recentMessages.length === 0 && (
              <div className="p-12 text-center text-slate-500 text-sm">Mesaj yok.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
