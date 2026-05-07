/**
 * Davetler — kim kimi davet etmiş listesi.
 * referrals tablosunu profile'larla birleştirip tablo halinde gösterir.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { UserPlus, Crown } from 'lucide-react';

type ReferralRow = {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
};

async function loadData() {
  const { data: refs } = await supabaseAdmin
    .from('referrals')
    .select('id, referrer_id, referred_id, referral_code, created_at')
    .order('created_at', { ascending: false })
    .limit(300);
  const referrals: ReferralRow[] = refs || [];

  // Tüm ilgili kullanıcıları toplu çek
  const userIds = Array.from(new Set(
    referrals.flatMap(r => [r.referrer_id, r.referred_id]).filter(Boolean)
  ));
  let profilesMap: Record<string, Profile> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, username, avatar_url')
      .in('id', userIds);
    if (profiles) {
      profilesMap = Object.fromEntries(profiles.map(p => [p.id, p as Profile]));
    }
  }

  // En çok davet eden top 10
  const counts = new Map<string, number>();
  for (const r of referrals) {
    counts.set(r.referrer_id, (counts.get(r.referrer_id) || 0) + 1);
  }
  const topReferrers = Array.from(counts.entries())
    .map(([id, count]) => ({ id, count, profile: profilesMap[id] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { referrals, profilesMap, topReferrers };
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default async function DavetlerPage() {
  const { referrals, profilesMap, topReferrers } = await loadData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-emerald-400" /> Davetler
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Toplam {referrals.length} kayıtlı davet · {topReferrers.length} farklı davetçi
        </p>
      </div>

      {/* Top 10 davetçi */}
      {topReferrers.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-bold tracking-wider text-slate-300 mb-4 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" /> EN ÇOK DAVET EDENLER
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {topReferrers.map((r, i) => (
              <div
                key={r.id}
                className="bg-white/[0.03] border border-white/10 rounded-xl p-3 flex items-center gap-3"
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i === 0 ? 'bg-amber-500/30 text-amber-200'
                  : i === 1 ? 'bg-slate-400/30 text-slate-100'
                  : i === 2 ? 'bg-orange-500/30 text-orange-200'
                  : 'bg-white/10 text-slate-400'
                }`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-100 truncate">
                    {r.profile?.display_name || r.id.slice(0, 12) + '…'}
                  </div>
                  <div className="text-[10px] text-emerald-300 font-bold">
                    {r.count} davet
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste */}
      {referrals.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-slate-500 text-sm">
          Henüz davet kaydı yok.
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-[10px] tracking-wider text-slate-400">
                <tr>
                  <th className="text-left px-5 py-3">TARİH</th>
                  <th className="text-left px-3 py-3">DAVET EDEN</th>
                  <th className="text-left px-3 py-3">DAVET EDİLEN</th>
                  <th className="text-left px-3 py-3">KOD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {referrals.map(r => {
                  const referrer = profilesMap[r.referrer_id];
                  const referred = profilesMap[r.referred_id];
                  return (
                    <tr key={r.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-2.5 text-xs text-slate-300 font-mono whitespace-nowrap">
                        {fmtDate(r.created_at)}
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        <div className="font-semibold text-cyan-300">
                          {referrer?.display_name || r.referrer_id.slice(0, 12) + '…'}
                        </div>
                        {referrer?.username && (
                          <div className="text-[10px] text-slate-500">@{referrer.username}</div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        <div className="font-semibold text-emerald-300">
                          {referred?.display_name || r.referred_id.slice(0, 12) + '…'}
                        </div>
                        {referred?.username && (
                          <div className="text-[10px] text-slate-500">@{referred.username}</div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-slate-400 font-mono">
                        {r.referral_code || '—'}
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
