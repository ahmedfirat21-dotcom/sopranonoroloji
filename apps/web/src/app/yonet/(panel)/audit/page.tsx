/**
 * Audit Log — admin işlemlerinin geçmişi.
 * Kim, ne zaman, hangi kullanıcıya ne yaptı.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ScrollText, AlertTriangle } from 'lucide-react';

const ACTION_LABEL: Record<string, { label: string; color: string }> = {
  // Kullanıcı
  user_delete: { label: 'Kullanıcı silindi', color: '#F87171' },
  user_update: { label: 'Kullanıcı güncellendi', color: '#5EEAD4' },
  user_toggle_admin: { label: 'Admin yetkisi değişti', color: '#C084FC' },
  user_warn: { label: 'Kullanıcı uyarıldı', color: '#FBBF24' },
  // Para
  cashout_status_change: { label: 'Para çekme durum değişti', color: '#34D399' },
  sp_grant: { label: 'SP grant', color: '#FBBF24' },
  // Oda
  room_delete: { label: 'Oda silindi', color: '#F87171' },
  room_close: { label: 'Oda kapatıldı', color: '#FBBF24' },
  room_wake: { label: 'Oda uyandırıldı', color: '#5EEAD4' },
  room_tier_change: { label: 'Oda tier değişti', color: '#C084FC' },
  // Mesaj
  message_soft_delete: { label: 'Mesaj silindi', color: '#F87171' },
  // Mağaza
  store_item_delete: { label: 'Ürün silindi', color: '#F87171' },
  store_item_update: { label: 'Ürün güncellendi', color: '#5EEAD4' },
  daily_deal_set: { label: 'Daily deal güncellendi', color: '#F472B6' },
  daily_deal_delete: { label: 'Daily deal silindi', color: '#F87171' },
  // Push
  push_send: { label: 'Push gönderildi', color: '#C084FC' },
  // Şikayet
  report_dismiss: { label: 'Şikayet reddedildi', color: '#94A3B8' },
  report_resolve: { label: 'Şikayet çözüldü', color: '#34D399' },
  report_ban: { label: 'Şikayet → ban', color: '#F87171' },
  // Auth
  login_success: { label: 'Admin giriş', color: '#5EEAD4' },
  login_failed: { label: 'Yanlış giriş', color: '#FBBF24' },
  login_locked: { label: 'IP kilitlendi', color: '#F87171' },
  logout: { label: 'Çıkış', color: '#94A3B8' },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

async function loadLogs() {
  const { data } = await supabaseAdmin
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);
  return data || [];
}

export default async function AuditPage() {
  const logs = await loadLogs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-cyan-400" /> Admin İşlem Kayıtları
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Son {logs.length} işlem · Yönetici aksiyonlarının kalıcı kaydı
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-bold text-amber-300 mb-1">Henüz kayıt yok</div>
            <div className="text-slate-400">
              Admin işlemleri (ban, sil, SP grant, cashout, push) bu listede otomatik görünür.
              {' '}İşlem yapıldığında <code className="bg-black/40 px-1 rounded">admin_audit_log</code> tablosuna eklenir.
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-[10px] tracking-wider text-slate-400">
                <tr>
                  <th className="text-left px-4 py-3">TARİH</th>
                  <th className="text-left px-3 py-3">ADMIN</th>
                  <th className="text-left px-3 py-3">İŞLEM</th>
                  <th className="text-left px-3 py-3">HEDEF</th>
                  <th className="text-left px-3 py-3">DETAY</th>
                  <th className="text-left px-3 py-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log: any) => {
                  const meta = ACTION_LABEL[log.action] || { label: log.action, color: '#94A3B8' };
                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-xs text-slate-300 font-mono whitespace-nowrap">
                        {fmtDate(log.created_at)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs font-semibold text-cyan-300">{log.admin_username || '—'}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                          style={{
                            background: `${meta.color}1a`,
                            borderColor: `${meta.color}40`,
                            color: meta.color,
                          }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        {log.target_type ? (
                          <div>
                            <div className="text-slate-400 text-[10px]">{log.target_type}</div>
                            <div className="text-slate-200 font-mono text-[11px] truncate max-w-[180px]">
                              {log.target_id || '—'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-slate-400 max-w-md">
                        {log.payload ? (
                          <code className="block bg-black/30 rounded px-1.5 py-0.5 text-[10px] truncate font-mono">
                            {JSON.stringify(log.payload)}
                          </code>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-[10px] font-mono text-slate-500">
                        {log.ip || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
