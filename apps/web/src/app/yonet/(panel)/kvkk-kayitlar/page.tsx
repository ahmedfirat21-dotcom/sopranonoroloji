/**
 * KVKK Kayıt Silme Günlüğü — recording_deletion_log tablosu denetim için
 * ════════════════════════════════════════════════════════════════════
 * v284 (16 May 2026) — KVKK madde 7 kapsamında silinen oda kayıtlarının
 *   kanıtı. 5 yıl saklanır (kvkk-deletion-log-purge cron).
 *
 * Bu panel: hangi kayıt ne zaman, neden silindi + storage fiziksel
 *   temizlik durumu (storage_cleaned).
 */
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type DeletionEntry = {
  id: number;
  recording_id: string;
  room_id: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  host_id: string | null;
  expired_at: string | null;
  deleted_at: string;
  deletion_reason: string;
  storage_cleaned: boolean;
};

const REASON_META: Record<string, { label: string; color: string }> = {
  ttl_expired:  { label: 'Süre doldu (TTL)', color: '#94A3B8' },
  user_request: { label: 'Kullanıcı talebi',  color: '#5EEAD4' },
  admin:        { label: 'Admin silme',       color: '#F87171' },
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('tr-TR'); } catch { return iso; }
}

function fmtDuration(sec: number | null) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}d ${s.toString().padStart(2, '0')}s`;
}

export default async function KvkkKayitlarPage() {
  const { data } = await supabaseAdmin
    .from('recording_deletion_log')
    .select('*')
    .order('deleted_at', { ascending: false })
    .limit(500);

  const logs = (data || []) as DeletionEntry[];
  const total = logs.length;
  const storageCleaned = logs.filter(l => l.storage_cleaned).length;
  const pending = total - storageCleaned;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold">KVKK Kayıt Silme Günlüğü</h1>
          <span className="text-xs text-slate-500">
            6698 sayılı KVKK madde 7 — veri imha kanıtı (5 yıl saklanır).
          </span>
        </div>
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/50 text-[11px] text-slate-300">
          <div className="leading-relaxed">
            <span className="font-medium text-slate-100">Otomatik silme zinciri:</span>{' '}
            <span className="font-mono text-cyan-300">room_recordings.expires_at &lt; NOW()</span> →
            <span className="font-mono text-cyan-300"> cleanup_expired_recordings()</span> cron (her 6 saat)
            DB satırını silip log'a yazar →
            <span className="font-mono text-cyan-300"> cleanup_recording_storage()</span> cron (5dk sonra)
            Supabase Storage'dan fiziksel dosyayı siler ve <span className="font-mono">storage_cleaned=true</span> mark eder.
          </div>
        </div>

        {/* İstatistik kartları */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-slate-900/40 border border-slate-700/40 px-3 py-2">
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Toplam silme</div>
            <div className="text-xl font-semibold text-slate-100">{total.toLocaleString('tr-TR')}</div>
          </div>
          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/30 px-3 py-2">
            <div className="text-[10px] text-emerald-400 uppercase tracking-wide">Storage temiz</div>
            <div className="text-xl font-semibold text-emerald-300">{storageCleaned.toLocaleString('tr-TR')}</div>
          </div>
          <div className={`rounded-lg ${pending > 0 ? 'bg-amber-500/5 border border-amber-500/30' : 'bg-slate-900/40 border border-slate-700/40'} px-3 py-2`}>
            <div className={`text-[10px] ${pending > 0 ? 'text-amber-400' : 'text-slate-500'} uppercase tracking-wide`}>Bekleyen fiziksel silme</div>
            <div className={`text-xl font-semibold ${pending > 0 ? 'text-amber-300' : 'text-slate-100'}`}>{pending.toLocaleString('tr-TR')}</div>
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="rounded-xl border border-slate-700/40 bg-slate-900/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="bg-slate-800/50 text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left">Silinme</th>
                <th className="px-3 py-2 text-left">Sebep</th>
                <th className="px-3 py-2 text-left">Süre</th>
                <th className="px-3 py-2 text-left">Recording ID</th>
                <th className="px-3 py-2 text-left">Host</th>
                <th className="px-3 py-2 text-left">Süre dolumu</th>
                <th className="px-3 py-2 text-center">Storage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {logs.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">Henüz silinmiş kayıt yok.</td></tr>
              ) : logs.map((row) => {
                const reasonMeta = REASON_META[row.deletion_reason] || { label: row.deletion_reason, color: '#94A3B8' };
                return (
                  <tr key={row.id} className="hover:bg-white/5">
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{fmtDate(row.deleted_at)}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ color: reasonMeta.color, backgroundColor: reasonMeta.color + '20', border: `1px solid ${reasonMeta.color}40` }}>
                        {reasonMeta.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400 font-mono">{fmtDuration(row.duration_seconds)}</td>
                    <td className="px-3 py-2 text-slate-500 font-mono text-[10px]">{row.recording_id.slice(0, 8)}…</td>
                    <td className="px-3 py-2 text-slate-400 font-mono text-[10px]">{row.host_id ? row.host_id.slice(0, 10) + '…' : '—'}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{fmtDate(row.expired_at)}</td>
                    <td className="px-3 py-2 text-center">
                      {row.storage_cleaned ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px]">✓ Temiz</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400 text-[10px]">⏳ Beklemede</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {logs.length === 500 && (
          <div className="px-3 py-2 text-[10px] text-slate-500 border-t border-slate-700/40 bg-slate-800/30">
            Son 500 kayıt gösteriliyor. Daha eski kayıtlar için direkt DB sorgusu yapın.
          </div>
        )}
      </div>
    </div>
  );
}
