"use client";

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Ban, ShieldCheck, Coins, Loader2, Crown, Trash2, AlertTriangle, Backpack } from 'lucide-react';
import InventoryModal from './InventoryModal';

type User = {
  id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  subscription_tier: string | null;
  is_admin: boolean | null;
  is_banned: boolean | null;
  is_verified: boolean | null;
  system_points: number | null;
  created_at: string;
  last_seen: string | null;
};

export default function UserSearchClient({ initialUsers, initialQuery }: {
  initialUsers: User[]; initialQuery: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [users, setUsers] = useState(initialUsers);
  const [q, setQ] = useState(initialQuery);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [inventoryFor, setInventoryFor] = useState<{ id: string; name: string } | null>(null);
  const [, startTransition] = useTransition();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(sp.toString());
    if (q.trim()) params.set('q', q.trim());
    else params.delete('q');
    router.push(`/yonet/kullanicilar?${params}`);
  };

  const callAction = async (uid: string, body: any) => {
    setBusyId(uid);
    try {
      const res = await fetch(`/yonet/api/users/${uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'İşlem başarısız');
      }
      // Local state güncelle
      if (body.action === 'delete') {
        setUsers(prev => prev.filter(u => u.id !== uid));
      } else if (body.action === 'toggle_admin') {
        setUsers(prev => prev.map(u => u.id === uid ? { ...u, is_admin: !!body.make_admin } : u));
      } else if (body.update) {
        setUsers(prev => prev.map(u => u.id === uid ? { ...u, ...body.update } : u));
      }
      startTransition(() => router.refresh());
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleWarn = (uid: string, displayName: string) => {
    const message = prompt(`"${displayName}" kullanıcısına gönderilecek uyarı mesajı:`,
      'Davranışlarınız nedeniyle bir uyarı aldınız. Kuralları tekrar ihlal etmeniz durumunda hesabınız askıya alınabilir.');
    if (message === null) return;
    if (!message.trim()) return alert('Mesaj boş olamaz');
    callAction(uid, { action: 'warn', message: message.trim() });
  };

  const handleTierChange = (uid: string, currentTier: string | null, newTier: string) => {
    const cur = currentTier || 'Free';
    if (newTier === cur) return;
    callAction(uid, { update: { subscription_tier: newTier } });
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-5 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="İsim veya kullanıcı adı ara..."
          className="w-full pl-10 pr-4 py-3 rounded-lg bg-black/30 border border-white/10 focus:border-cyan-500/50 focus:outline-none text-sm"
        />
      </form>

      {/* Mobile: kart layout */}
      <div className="lg:hidden space-y-3">
        {users.map(u => {
          const isBusy = busyId === u.id;
          return (
            <div key={u.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="w-11 h-11 rounded-full bg-slate-700 object-cover shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {(u.display_name || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-100 truncate flex items-center gap-1.5">
                    {u.display_name}
                    {u.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />}
                    {u.is_admin && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {u.username ? `@${u.username}` : u.id.slice(0, 12) + '…'}
                  </div>
                </div>
                {u.is_banned ? (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/40 text-red-300 text-[10px] font-bold shrink-0">BANLI</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold shrink-0">AKTİF</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs mb-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${tierStyle(u.subscription_tier)}`}>
                  {(u.subscription_tier || 'Free').toUpperCase()}
                </span>
                <span className="text-amber-300 font-mono">
                  {(u.system_points ?? 0).toLocaleString('tr-TR')} SP
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => callAction(u.id, { update: { is_verified: !u.is_verified } })}
                  disabled={isBusy}
                  className={`px-2 py-2 rounded-md text-[10px] font-semibold border transition-colors flex items-center justify-center gap-1 ${
                    u.is_verified
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
                      : 'bg-white/5 border-white/10 text-slate-300'
                  }`}
                >
                  ✓ TİK
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!u.is_banned && !confirm(`"${u.display_name}" banlanacak. Devam?`)) return;
                    callAction(u.id, { update: { is_banned: !u.is_banned } });
                  }}
                  disabled={isBusy}
                  className={`px-2 py-2 rounded-md text-[10px] font-semibold border transition-colors flex items-center justify-center gap-1 ${
                    u.is_banned
                      ? 'bg-green-500/15 border-green-500/40 text-green-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                  {u.is_banned ? 'KALDIR' : 'BAN'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const cur = u.system_points || 0;
                    const newVal = prompt(`${u.display_name} için yeni SP miktarı:`, String(cur));
                    if (newVal === null) return;
                    const n = parseInt(newVal, 10);
                    if (!Number.isFinite(n) || n < 0) return alert('Geçersiz değer');
                    await callAction(u.id, { update: { system_points: n } });
                  }}
                  disabled={isBusy}
                  className="px-2 py-2 rounded-md text-[10px] font-semibold border bg-amber-500/10 border-amber-500/30 text-amber-300 flex items-center justify-center gap-1"
                >
                  <Coins className="w-3 h-3" /> SP
                </button>
                <select
                  value={u.subscription_tier || 'Free'}
                  onChange={e => handleTierChange(u.id, u.subscription_tier, e.target.value)}
                  disabled={isBusy}
                  aria-label="Üyelik planı"
                  className={`px-2 py-2 rounded-md text-[10px] font-bold border transition-colors cursor-pointer outline-none ${tierStyle(u.subscription_tier)}`}
                  title="Üyelik planı"
                >
                  <option value="Free">🆓 FREE</option>
                  <option value="Plus">🚀 PLUS</option>
                  <option value="Pro">👑 PRO</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const willMakeAdmin = !u.is_admin;
                    if (!confirm(`"${u.display_name}" — ${willMakeAdmin ? 'ADMIN yap' : 'admin yetkisini AL'}?`)) return;
                    callAction(u.id, { action: 'toggle_admin', make_admin: willMakeAdmin });
                  }}
                  disabled={isBusy}
                  className={`px-2 py-2 rounded-md text-[10px] font-semibold border transition-colors flex items-center justify-center gap-1 ${
                    u.is_admin
                      ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-200'
                      : 'bg-white/5 border-white/10 text-slate-300'
                  }`}
                >
                  <Crown className="w-3 h-3" /> ADMIN
                </button>
                <button
                  type="button"
                  onClick={() => handleWarn(u.id, u.display_name)}
                  disabled={isBusy}
                  className="px-2 py-2 rounded-md text-[10px] font-semibold border bg-yellow-500/10 border-yellow-500/30 text-yellow-300 flex items-center justify-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3" /> UYAR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm(`⚠️ "${u.display_name}" KALICI silinecek!\nGERİ ALINAMAZ. Devam?`)) return;
                    if (!confirm(`Son onay: silinecek.`)) return;
                    callAction(u.id, { action: 'delete' });
                  }}
                  disabled={isBusy}
                  className="px-2 py-2 rounded-md text-[10px] font-semibold border bg-red-500/15 border-red-500/40 text-red-200 flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> SİL
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryFor({ id: u.id, name: u.display_name })}
                  disabled={isBusy}
                  className="px-2 py-2 rounded-md text-[10px] font-semibold border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1 col-span-3"
                  title="Envanter — ürün ekle/çıkar, test hesabı yap"
                >
                  <Backpack className="w-3 h-3" /> ENVANTER / TEST HESABI YAP
                </button>
              </div>
            </div>
          );
        })}
        {users.length === 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-slate-500 text-sm">
            Sonuç bulunamadı.
          </div>
        )}
      </div>

      {/* Desktop: tablo layout */}
      <div className="hidden lg:block bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] text-[10px] tracking-wider text-slate-400">
              <tr>
                <th className="text-left px-5 py-3">KULLANICI</th>
                <th className="text-left px-3 py-3">TIER</th>
                <th className="text-right px-3 py-3">SP</th>
                <th className="text-center px-3 py-3">DURUM</th>
                <th className="text-right px-5 py-3">AKSİYONLAR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map(u => {
                const isBusy = busyId === u.id;
                return (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-9 h-9 rounded-full bg-slate-700 object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                            {(u.display_name || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-100 truncate flex items-center gap-1.5">
                            {u.display_name}
                            {u.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />}
                            {u.is_admin && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {u.username ? `@${u.username}` : u.id.slice(0, 12) + '…'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={u.subscription_tier || 'Free'}
                        onChange={e => handleTierChange(u.id, u.subscription_tier, e.target.value)}
                        disabled={isBusy}
                        aria-label="Üyelik planı"
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider transition-opacity hover:opacity-80 cursor-pointer outline-none ${tierStyle(u.subscription_tier)}`}
                        title="Üyelik planını değiştir"
                      >
                        <option value="Free">🆓 FREE</option>
                        <option value="Plus">🚀 PLUS</option>
                        <option value="Pro">👑 PRO</option>
                      </select>
                    </td>
                    <td className="px-3 py-3 text-right text-amber-300 font-mono text-xs">
                      {(u.system_points ?? 0).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {u.is_banned ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/40 text-red-300 text-[10px] font-bold">BANLI</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold">AKTİF</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Verify toggle */}
                        <button
                          onClick={() => callAction(u.id, { update: { is_verified: !u.is_verified } })}
                          disabled={isBusy}
                          className={`px-2 py-1.5 rounded-md text-[10px] font-semibold border transition-colors ${
                            u.is_verified
                              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                          }`}
                          title={u.is_verified ? 'Tikiyi kaldır' : 'Tikiyi ver'}
                        >
                          ✓ TİK
                        </button>
                        {/* Ban toggle */}
                        <button
                          onClick={() => {
                            if (!u.is_banned && !confirm(`"${u.display_name}" kullanıcısı banlanacak. Devam?`)) return;
                            callAction(u.id, { update: { is_banned: !u.is_banned } });
                          }}
                          disabled={isBusy}
                          className={`px-2 py-1.5 rounded-md text-[10px] font-semibold border transition-colors flex items-center gap-1 ${
                            u.is_banned
                              ? 'bg-green-500/15 border-green-500/40 text-green-300 hover:bg-green-500/25'
                              : 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20'
                          }`}
                        >
                          {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                          {u.is_banned ? 'BAN KALDIR' : 'BAN'}
                        </button>
                        {/* SP düzenle */}
                        <button
                          onClick={async () => {
                            const cur = u.system_points || 0;
                            const newVal = prompt(`${u.display_name} için yeni SP miktarı:`, String(cur));
                            if (newVal === null) return;
                            const n = parseInt(newVal, 10);
                            if (!Number.isFinite(n) || n < 0) return alert('Geçersiz değer');
                            await callAction(u.id, { update: { system_points: n } });
                          }}
                          disabled={isBusy}
                          className="px-2 py-1.5 rounded-md text-[10px] font-semibold border bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors flex items-center gap-1"
                        >
                          <Coins className="w-3 h-3" /> SP
                        </button>
                        {/* Admin yetki toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            const willMakeAdmin = !u.is_admin;
                            const verb = willMakeAdmin ? 'ADMIN yap' : 'admin yetkisini AL';
                            if (!confirm(`"${u.display_name}" kullanıcısını ${verb}? Devam?`)) return;
                            callAction(u.id, { action: 'toggle_admin', make_admin: willMakeAdmin });
                          }}
                          disabled={isBusy}
                          className={`px-2 py-1.5 rounded-md text-[10px] font-semibold border transition-colors flex items-center gap-1 ${
                            u.is_admin
                              ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-200'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                          }`}
                          title={u.is_admin ? 'Admin yetkisini al' : 'Admin yap'}
                        >
                          <Crown className="w-3 h-3" />
                        </button>
                        {/* Uyarı mesajı */}
                        <button
                          type="button"
                          onClick={() => handleWarn(u.id, u.display_name)}
                          disabled={isBusy}
                          className="px-2 py-1.5 rounded-md text-[10px] font-semibold border bg-yellow-500/10 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20 transition-colors flex items-center gap-1"
                          title="Kullanıcıya uyarı mesajı gönder"
                        >
                          <AlertTriangle className="w-3 h-3" />
                        </button>
                        {/* Kalıcı sil — cascade */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!confirm(`⚠️ "${u.display_name}" KALICI olarak silinecek!\n\nSilinecekler:\n• Profil\n• Tüm odaları\n• Mesajları\n• Arkadaşlıkları\n• Raporları\n\nGERİ ALINAMAZ. Devam?`)) return;
                            if (!confirm(`Son onay: "${u.display_name}" silinecek. Eminmisin?`)) return;
                            callAction(u.id, { action: 'delete' });
                          }}
                          disabled={isBusy}
                          className="px-2 py-1.5 rounded-md text-[10px] font-semibold border bg-red-500/15 border-red-500/40 text-red-200 hover:bg-red-500/25 transition-colors flex items-center gap-1"
                          title="Kullanıcıyı kalıcı sil (cascade)"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setInventoryFor({ id: u.id, name: u.display_name })}
                          disabled={isBusy}
                          className="px-2 py-1.5 rounded-md text-[10px] font-semibold border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                          title="Envanter / test hesabı yap"
                        >
                          <Backpack className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500 text-sm">
                    Sonuç bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {inventoryFor && (
        <InventoryModal
          userId={inventoryFor.id}
          displayName={inventoryFor.name}
          onClose={() => setInventoryFor(null)}
          onChanged={() => {
            // Tier/SP değişmiş olabilir (test_account aksiyonu) — listeyi yenile
            startTransition(() => router.refresh());
          }}
        />
      )}
    </div>
  );
}

function tierStyle(tier: string | null): string {
  switch (tier) {
    case 'Pro': return 'bg-amber-500/15 border border-amber-500/40 text-amber-300';
    case 'Plus': return 'bg-teal-500/15 border border-teal-500/40 text-teal-300';
    default: return 'bg-slate-500/10 border border-slate-500/30 text-slate-400';
  }
}
