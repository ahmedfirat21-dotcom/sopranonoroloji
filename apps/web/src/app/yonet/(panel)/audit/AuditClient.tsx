"use client";

/**
 * ★ P2-7 (16 May 2026): Audit log client — filtre dropdown'ları + arama.
 * Önceden 300 satır salt SSR + filtre yoktu. Şimdi anlık client-side filter:
 *  - İşlem tipi (action_type select)
 *  - Admin kullanıcı adı (free-text)
 *  - Tarih aralığı (24s / 7g / 30g / tümü)
 */
import { useMemo, useState } from 'react';
import { ScrollText, AlertTriangle, Filter, X } from 'lucide-react';

type LogRow = {
  id: string;
  action: string;
  admin_username: string | null;
  target_type: string | null;
  target_id: string | null;
  payload: any;
  ip: string | null;
  created_at: string;
};

interface Props {
  logs: LogRow[];
  actionMeta: Record<string, { label: string; color: string }>;
  payloadKeyLabel: Record<string, string>;
}

const RANGE_OPTIONS: { value: '24h' | '7d' | '30d' | 'all'; label: string }[] = [
  { value: '24h', label: 'Son 24 saat' },
  { value: '7d',  label: 'Son 7 gün' },
  { value: '30d', label: 'Son 30 gün' },
  { value: 'all', label: 'Tümü' },
];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function payloadToText(payload: any, labelMap: Record<string, string>): { label: string; value: string }[] {
  if (!payload || typeof payload !== 'object') return [];
  const out: { label: string; value: string }[] = [];
  for (const k of Object.keys(payload)) {
    const v = payload[k];
    if (v === undefined || v === null || v === '') continue;
    const label = labelMap[k] || k;
    let text: string;
    if (typeof v === 'boolean') text = v ? 'Evet' : 'Hayır';
    else if (typeof v === 'object') text = JSON.stringify(v);
    else text = String(v);
    if (text.length > 80) text = text.slice(0, 77) + '…';
    out.push({ label, value: text });
  }
  return out;
}

export default function AuditClient({ logs, actionMeta, payloadKeyLabel }: Props) {
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [adminFilter, setAdminFilter] = useState<string>('');
  const [rangeFilter, setRangeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('all');

  // Unique action types from data
  const availableActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => l.action && set.add(l.action));
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff = rangeFilter === '24h' ? now - 24 * 60 * 60 * 1000
      : rangeFilter === '7d' ? now - 7 * 24 * 60 * 60 * 1000
      : rangeFilter === '30d' ? now - 30 * 24 * 60 * 60 * 1000
      : 0;
    const adminQ = adminFilter.trim().toLowerCase();
    return logs.filter(l => {
      if (actionFilter !== 'all' && l.action !== actionFilter) return false;
      if (cutoff > 0 && new Date(l.created_at).getTime() < cutoff) return false;
      if (adminQ && !(l.admin_username || '').toLowerCase().includes(adminQ)) return false;
      return true;
    });
  }, [logs, actionFilter, adminFilter, rangeFilter]);

  const hasActiveFilter = actionFilter !== 'all' || adminFilter.trim() !== '' || rangeFilter !== 'all';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-cyan-400" /> Admin İşlem Kayıtları
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {filtered.length} / {logs.length} kayıt · Yönetici aksiyonlarının kalıcı kaydı
        </p>
      </div>

      {/* Filtre çubuğu */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Filter className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">FİLTRELER:</span>
        </div>

        {/* İşlem tipi */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-slate-500">İşlem Tipi</label>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md bg-black/30 border border-white/10 text-xs text-slate-100"
          >
            <option value="all">Hepsi</option>
            {availableActions.map(a => (
              <option key={a} value={a}>{actionMeta[a]?.label || a}</option>
            ))}
          </select>
        </div>

        {/* Admin */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-slate-500">Admin</label>
          <input
            type="text"
            value={adminFilter}
            onChange={e => setAdminFilter(e.target.value)}
            placeholder="kullanıcı adı"
            className="px-2.5 py-1.5 rounded-md bg-black/30 border border-white/10 text-xs text-slate-100 w-36"
          />
        </div>

        {/* Tarih aralığı */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-slate-500">Tarih</label>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRangeFilter(r.value)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold border transition-colors ${
                  rangeFilter === r.value
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => { setActionFilter('all'); setAdminFilter(''); setRangeFilter('all'); }}
            className="ml-auto px-2.5 py-1.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] font-semibold flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Temizle
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-bold text-amber-300 mb-1">
              {hasActiveFilter ? 'Filtreye uyan kayıt yok' : 'Henüz kayıt yok'}
            </div>
            <div className="text-slate-400">
              {hasActiveFilter
                ? 'Filtreyi gevşet veya temizle.'
                : 'Admin işlemleri (ban, sil, SP grant, cashout, push) bu listede otomatik görünür.'}
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
                {filtered.map(log => {
                  const meta = actionMeta[log.action] || { label: log.action, color: '#94A3B8' };
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
                        {(() => {
                          const items = payloadToText(log.payload, payloadKeyLabel);
                          if (items.length === 0) return <span className="text-slate-600">—</span>;
                          return (
                            <div className="space-y-0.5">
                              {items.map((it, i) => (
                                <div key={i} className="flex gap-1.5">
                                  <span className="text-slate-500 shrink-0">{it.label}:</span>
                                  <span className="text-slate-200 truncate">{it.value}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
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
