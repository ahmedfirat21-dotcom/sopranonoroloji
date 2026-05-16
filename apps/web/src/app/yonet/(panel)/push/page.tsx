/**
 * SopranoChat Admin — Push Bildirim
 * Toplu push gönderimi (broadcast / tier / tek kullanıcı) + geçmiş.
 * ★ F-4 (16 May 2026): Son 50 push gönderimi audit log'tan listelenir.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Bell, History, CheckCircle2, XCircle } from 'lucide-react';
import PushClient from './PushClient';

async function loadStats() {
  const [{ count: tokenCount }] = await Promise.all([
    supabaseAdmin.from('push_tokens').select('id', { count: 'exact', head: true }),
  ]);

  // Distinct user count via simple query (head=true ile distinct yok, manuel sayım)
  const { data: distinctUsers } = await supabaseAdmin
    .from('push_tokens')
    .select('user_id');
  const distinct = new Set((distinctUsers || []).map(d => d.user_id)).size;

  return {
    totalTokens: tokenCount || 0,
    distinctUsers: distinct,
  };
}

async function loadRecentPushes() {
  const { data } = await supabaseAdmin
    .from('admin_audit_log')
    .select('id, admin_username, payload, created_at')
    .eq('action', 'push_send')
    .order('created_at', { ascending: false })
    .limit(50);
  return data || [];
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default async function PushPage() {
  const [stats, recent] = await Promise.all([loadStats(), loadRecentPushes()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="w-6 h-6 text-fuchsia-400" /> Push Bildirim
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {stats.distinctUsers.toLocaleString('tr-TR')} aktif cihaz · {stats.totalTokens.toLocaleString('tr-TR')} token
        </p>
      </div>

      <PushClient totalTokens={stats.totalTokens} distinctUsers={stats.distinctUsers} />

      {/* ★ F-4 (16 May 2026): Son gönderim geçmişi */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-200">Son Gönderimler</h2>
          <span className="text-[10px] text-slate-500 ml-2">({recent.length})</span>
        </div>
        {recent.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            Henüz push gönderilmemiş. Yukarıdan ilk gönderiyi yap.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-[10px] tracking-wider text-slate-400">
                <tr>
                  <th className="text-left px-4 py-2.5">TARİH</th>
                  <th className="text-left px-3 py-2.5">ADMIN</th>
                  <th className="text-left px-3 py-2.5">BAŞLIK</th>
                  <th className="text-left px-3 py-2.5">İÇERİK</th>
                  <th className="text-left px-3 py-2.5">HEDEF</th>
                  <th className="text-right px-4 py-2.5">SONUÇ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recent.map((r: any) => {
                  const p = r.payload || {};
                  const sent = Number(p.sent || 0);
                  const failed = Number(p.failed || 0);
                  return (
                    <tr key={r.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-xs text-slate-300 font-mono whitespace-nowrap">{fmtDate(r.created_at)}</td>
                      <td className="px-3 py-2.5 text-xs text-cyan-300 font-semibold">{r.admin_username || '—'}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-100 max-w-[180px] truncate" title={p.title || ''}>{p.title || '—'}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-400 max-w-[260px] truncate" title={p.body || ''}>{p.body || '—'}</td>
                      <td className="px-3 py-2.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-200 font-semibold">
                          {p.audience || p.tier || p.user_id || 'all'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="inline-flex items-center gap-1 text-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-300 font-mono">{sent}</span>
                          {failed > 0 && (
                            <>
                              <span className="text-slate-600 mx-0.5">·</span>
                              <XCircle className="w-3 h-3 text-red-400" />
                              <span className="text-red-300 font-mono">{failed}</span>
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
