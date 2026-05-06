/**
 * SopranoChat Admin — SP İşlemleri
 * Son işlemler + manuel SP grant.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Coins } from 'lucide-react';
import SPClient from './SPClient';

async function loadTransactions() {
  const { data: txs } = await supabaseAdmin
    .from('sp_transactions')
    .select('id, user_id, amount, type, description, counterparty_id, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (!txs || txs.length === 0) return [];

  const userIds = Array.from(new Set([
    ...txs.map(t => t.user_id),
    ...txs.map(t => t.counterparty_id).filter(Boolean) as string[],
  ]));

  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', userIds);
  const profMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

  return txs.map(t => ({
    ...t,
    user: profMap[t.user_id] || null,
    counterparty: t.counterparty_id ? profMap[t.counterparty_id] : null,
  }));
}

async function load24hTotals() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from('sp_transactions')
    .select('amount')
    .gte('created_at', since);

  const txs = data || [];
  const totalVolume = txs.reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const totalIn = txs.filter(t => (t.amount || 0) > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = txs.filter(t => (t.amount || 0) < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  return { count: txs.length, totalVolume, totalIn, totalOut };
}

export default async function SPPage() {
  const [transactions, totals] = await Promise.all([
    loadTransactions(),
    load24hTotals(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Coins className="w-6 h-6 text-amber-400" /> SP İşlemleri
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Son 100 işlem · 24h: {totals.count} işlem, {totals.totalVolume.toLocaleString('tr-TR')} SP hacim
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-[10px] tracking-wider text-slate-400 mb-1">24H GİREN (KAZANIM)</div>
          <div className="text-xl font-bold text-emerald-300 font-mono">
            +{totals.totalIn.toLocaleString('tr-TR')}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-[10px] tracking-wider text-slate-400 mb-1">24H ÇIKAN (HARCAMA)</div>
          <div className="text-xl font-bold text-red-300 font-mono">
            −{totals.totalOut.toLocaleString('tr-TR')}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-[10px] tracking-wider text-slate-400 mb-1">24H NET</div>
          <div className="text-xl font-bold text-amber-300 font-mono">
            {(totals.totalIn - totals.totalOut).toLocaleString('tr-TR')}
          </div>
        </div>
      </div>

      <SPClient transactions={transactions as any} />
    </div>
  );
}
