"use client";

import { useState } from 'react';
import { Send, Loader2, Users, User as UserIcon, Crown } from 'lucide-react';
import { useAdminDialog } from '../../_components/AdminDialog';

type Audience = 'all' | 'tier' | 'user';

export default function PushClient({
  totalTokens,
  distinctUsers,
}: {
  totalTokens: number;
  distinctUsers: number;
}) {
  const dialog = useAdminDialog();
  const [audience, setAudience] = useState<Audience>('all');
  const [tier, setTier] = useState<'Free' | 'Plus' | 'Pro'>('Plus');
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    total?: number;
    ticketsAccepted?: number;
    ticketsRejected?: number;
    delivered?: number;
    receiptErrors?: number;
    errorBreakdown?: Record<string, number>;
    cleanedTokens?: number;
    error?: string;
  } | null>(null);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      await dialog.alert({ title: 'Eksik bilgi', message: 'Başlık ve metin gerekli.', variant: 'error' });
      return;
    }
    if (audience === 'user' && !userId.trim()) {
      await dialog.alert({ title: 'Kullanıcı seçilmedi', message: 'Tek kullanıcıya gönderim için ID gir.', variant: 'error' });
      return;
    }

    const audienceLabel = audience === 'all'
      ? `${distinctUsers.toLocaleString('tr-TR')} kullanıcı`
      : audience === 'tier'
        ? `${tier} aboneleri`
        : `1 kullanıcı`;

    const ok = await dialog.confirm({
      title: 'Push bildirim gönder',
      message: `"${title}" başlıklı bildirim ${audienceLabel} hedefine gönderilecek.`,
      confirmLabel: 'Gönder',
    });
    if (!ok) return;

    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/yonet/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience,
          tier: audience === 'tier' ? tier : null,
          user_id: audience === 'user' ? userId.trim() : null,
          title: title.trim(),
          body: body.trim(),
          data: link.trim() ? { link: link.trim() } : undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setResult({ ok: false, error: j.error || 'Hata' });
      } else {
        setResult({
          ok: true,
          total: j.total || 0,
          ticketsAccepted: j.ticketsAccepted || 0,
          ticketsRejected: j.ticketsRejected || 0,
          delivered: j.delivered || 0,
          receiptErrors: j.receiptErrors || 0,
          errorBreakdown: j.errorBreakdown || {},
          cleanedTokens: j.cleanedTokens || 0,
        });
        setTitle('');
        setBody('');
        setLink('');
      }
    } catch (e: any) {
      setResult({ ok: false, error: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Form */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
        <div>
          <label className="block text-[10px] font-semibold tracking-wider mb-2 text-slate-400">HEDEF KİTLE</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAudience('all')}
              className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 ${
                audience === 'all'
                  ? 'bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-200'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Herkese
            </button>
            <button
              type="button"
              onClick={() => setAudience('tier')}
              className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 ${
                audience === 'tier'
                  ? 'bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-200'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              <Crown className="w-3.5 h-3.5" /> Üyelik
            </button>
            <button
              type="button"
              onClick={() => setAudience('user')}
              className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 ${
                audience === 'user'
                  ? 'bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-200'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" /> Tek
            </button>
          </div>
        </div>

        {audience === 'tier' && (
          <div>
            <label className="block text-[10px] font-semibold tracking-wider mb-1 text-slate-400">ÜYELİK PLANI</label>
            <div className="flex gap-2">
              {(['Free', 'Plus', 'Pro'] as const).map(t => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTier(t)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    tier === t
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {audience === 'user' && (
          <div>
            <label className="block text-[10px] font-semibold tracking-wider mb-1 text-slate-400">KULLANICI ID</label>
            <input
              type="text"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder="Firebase UID"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-fuchsia-500/50 focus:outline-none font-mono text-xs"
            />
          </div>
        )}

        <div>
          <label className="block text-[10px] font-semibold tracking-wider mb-1 text-slate-400">BAŞLIK</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="SopranoChat"
            maxLength={80}
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-fuchsia-500/50 focus:outline-none"
          />
          <div className="text-[10px] text-slate-500 mt-1 text-right">{title.length}/80</div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold tracking-wider mb-1 text-slate-400">METİN</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Bildirim içeriği..."
            maxLength={240}
            rows={4}
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-fuchsia-500/50 focus:outline-none resize-none"
          />
          <div className="text-[10px] text-slate-500 mt-1 text-right">{body.length}/240</div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold tracking-wider mb-1 text-slate-400">UYGULAMA İÇİ BAĞLANTI (OPSİYONEL)</label>
          <input
            type="text"
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="sopranochat://store"
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-fuchsia-500/50 focus:outline-none font-mono text-xs"
          />
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={busy}
          className="w-full px-4 py-3 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-200 font-semibold hover:bg-fuchsia-500/30 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {busy ? 'Gönderiliyor...' : 'Gönder'}
        </button>

        {result && (
          <div className={`p-3 rounded-lg border text-sm space-y-1 ${
            result.ok && (result.delivered || 0) > 0 && (result.receiptErrors || 0) === 0
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : result.ok
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {!result.ok && <div>✗ Hata: {result.error}</div>}
            {result.ok && (
              <>
                <div className="font-semibold">
                  {(result.delivered || 0) > 0 && (result.receiptErrors || 0) === 0 ? '✓' : '⚠'} Sonuç (toplam {result.total} hedef token)
                </div>
                <div className="text-xs space-y-0.5 opacity-90">
                  <div>• Cihaza ulaşan: <b>{result.delivered || 0}</b></div>
                  <div>• Expo kabul etti (ticket OK): {result.ticketsAccepted || 0}</div>
                  {(result.ticketsRejected || 0) > 0 && (
                    <div>• Expo reddetti: {result.ticketsRejected}</div>
                  )}
                  {(result.receiptErrors || 0) > 0 && (
                    <div>• FCM/APNs hatası: <b>{result.receiptErrors}</b></div>
                  )}
                  {result.errorBreakdown && Object.keys(result.errorBreakdown).length > 0 && (
                    <div className="pl-3 mt-1 border-l border-white/10">
                      {Object.entries(result.errorBreakdown).map(([err, count]) => (
                        <div key={err}>↳ <code className="text-[11px]">{err}</code>: {count}</div>
                      ))}
                    </div>
                  )}
                  {(result.cleanedTokens || 0) > 0 && (
                    <div className="text-[11px] opacity-70 mt-1">{result.cleanedTokens} geçersiz token DB'den temizlendi.</div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Önizleme */}
      <div className="space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="text-[10px] tracking-wider text-slate-400 mb-3 font-semibold">ÖNİZLEME</div>
          <div className="bg-slate-800 rounded-2xl p-4 border border-white/5 max-w-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-fuchsia-500/30 flex items-center justify-center text-lg font-bold">
                S
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-xs text-slate-300 font-semibold">SopranoChat</span>
                  <span className="text-[10px] text-slate-500">şimdi</span>
                </div>
                <div className="text-sm font-bold text-slate-100 mb-0.5 break-words">
                  {title || 'Başlık'}
                </div>
                <div className="text-xs text-slate-300 break-words">
                  {body || 'Bildirim metni burada görünecek...'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-200/80">
          <strong className="text-amber-200">Uyarı:</strong> "Herkese" gönderim son derece etkilidir.
          Spam algılanırsa Apple/Google FCM hesabı kısıtlayabilir. Sadece önemli duyurular için kullan.
        </div>
      </div>
    </div>
  );
}
