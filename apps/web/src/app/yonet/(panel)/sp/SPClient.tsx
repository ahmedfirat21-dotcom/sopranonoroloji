"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';

type Profile = { display_name: string; avatar_url: string };

type Tx = {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string | null;
  counterparty_id: string | null;
  created_at: string;
  user: Profile | null;
  counterparty: Profile | null;
};

export default function SPClient({ transactions }: { transactions: Tx[] }) {
  const router = useRouter();
  const [showGrant, setShowGrant] = useState(false);
  const [filter, setFilter] = useState('');
  const [, startTransition] = useTransition();

  const filtered = filter.trim()
    ? transactions.filter(t => {
        const f = filter.toLowerCase();
        return (
          (t.user?.display_name || '').toLowerCase().includes(f) ||
          (t.user_id || '').toLowerCase().includes(f) ||
          (t.type || '').toLowerCase().includes(f) ||
          (t.description || '').toLowerCase().includes(f)
        );
      })
    : transactions;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Kullanıcı / tip / açıklama ara..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowGrant(true)}
          className="px-4 py-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Manuel SP Ver
        </button>
      </div>

      {/* Mobile: kart liste */}
      <div className="lg:hidden space-y-2">
        {filtered.map(t => (
          <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="font-semibold text-sm text-slate-100 truncate">
                {t.user?.display_name || t.user_id.slice(0, 12) + '…'}
              </div>
              <span className={`font-mono text-sm font-bold shrink-0 ${t.amount > 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('tr-TR')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1">
              <span className="px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 font-bold tracking-wider">
                {t.type.toUpperCase()}
              </span>
              <span className="text-slate-500">{new Date(t.created_at).toLocaleString('tr-TR')}</span>
            </div>
            {t.description && (
              <div className="text-[11px] text-slate-300 truncate">{t.description}</div>
            )}
            {t.counterparty && (
              <div className="text-[10px] text-slate-500 mt-1">→ {t.counterparty.display_name}</div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-slate-500 text-sm">
            İşlem bulunamadı.
          </div>
        )}
      </div>

      {/* Desktop: tablo */}
      <div className="hidden lg:block bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] text-[10px] tracking-wider text-slate-400">
              <tr>
                <th className="text-left px-5 py-3">KULLANICI</th>
                <th className="text-left px-3 py-3">TİP</th>
                <th className="text-left px-3 py-3">AÇIKLAMA</th>
                <th className="text-left px-3 py-3">KARŞI TARAF</th>
                <th className="text-right px-3 py-3">MİKTAR</th>
                <th className="text-right px-5 py-3">ZAMAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <div className="text-sm font-semibold text-slate-200">
                      {t.user?.display_name || t.user_id.slice(0, 12) + '…'}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{t.user_id.slice(0, 16)}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-wider text-slate-300">
                      {t.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-400 max-w-xs truncate" title={t.description || ''}>
                    {t.description || '—'}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-300">
                    {t.counterparty?.display_name || (t.counterparty_id ? t.counterparty_id.slice(0, 10) + '…' : '—')}
                  </td>
                  <td className={`px-3 py-3 text-right font-mono text-sm font-bold ${
                    t.amount > 0 ? 'text-emerald-300' : 'text-red-300'
                  }`}>
                    <span className="inline-flex items-center gap-1">
                      {t.amount > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('tr-TR')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-[10px] text-slate-500">
                    {new Date(t.created_at).toLocaleString('tr-TR')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500 text-sm">
                    İşlem bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showGrant && (
        <GrantModal
          onClose={() => setShowGrant(false)}
          onGranted={() => {
            setShowGrant(false);
            startTransition(() => router.refresh());
          }}
        />
      )}
    </div>
  );
}

function GrantModal({ onClose, onGranted }: { onClose: () => void; onGranted: () => void }) {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState(100);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; display_name: string; username: string | null }[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/yonet/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) {
        const j = await res.json();
        setSearchResults(j.users || []);
      }
    } finally {
      setSearching(false);
    }
  };

  const handleGrant = async () => {
    if (!userId.trim()) {
      alert('Kullanıcı ID seçilmedi');
      return;
    }
    if (!amount || amount === 0) {
      alert('Geçersiz miktar');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/yonet/api/sp/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, amount, reason }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'İşlem başarısız');
      }
      onGranted();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-auto">
      <div className="bg-slate-900 border border-white/10 rounded-xl sm:rounded-2xl w-full max-w-md my-2 sm:my-0">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold">Manuel SP Ver / Al</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-4 text-sm">
          <div>
            <label className="block text-[10px] font-semibold tracking-wider mb-1 text-slate-400">KULLANICI ARA</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); }}}
                placeholder="İsim veya username..."
                className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching}
                className="px-3 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-semibold disabled:opacity-50"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ara'}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-40 overflow-auto border border-white/10 rounded-lg divide-y divide-white/5">
                {searchResults.map(u => (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => {
                      setUserId(u.id);
                      setSearchQuery(u.display_name);
                      setSearchResults([]);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-white/5 text-xs"
                  >
                    <div className="font-semibold">{u.display_name}</div>
                    <div className="text-slate-500">{u.username ? `@${u.username}` : u.id.slice(0, 14) + '…'}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-semibold tracking-wider mb-1 text-slate-400">SEÇİLEN KULLANICI ID</label>
            <input
              type="text"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none font-mono text-xs"
              placeholder="Manuel ID girilebilir"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold tracking-wider mb-1 text-slate-400">MİKTAR (negatif = al)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold tracking-wider mb-1 text-slate-400">SEBEP</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Örn: bug hediyesi"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:border-amber-500/50 focus:outline-none"
            />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-white/10 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleGrant}
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-sm font-semibold hover:bg-amber-500/30 disabled:opacity-50 flex items-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Onayla
          </button>
        </div>
      </div>
    </div>
  );
}
