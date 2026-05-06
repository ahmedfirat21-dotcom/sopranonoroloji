/**
 * SopranoChat Admin — Şikayetler
 * Pending raporları listele + dismiss / ban actions.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Flag } from 'lucide-react';
import ReportRow from './ReportRow';

const REASON_LABEL: Record<string, string> = {
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

async function getReports() {
  const { data: reports, error } = await supabaseAdmin
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error || !reports) return [];

  // Reporter + reported user profilleri toplu çek
  const userIds = Array.from(new Set(
    reports.flatMap(r => [r.reporter_id, r.reported_user_id]).filter(Boolean)
  ));
  let profilesMap: Record<string, { display_name: string; avatar_url: string }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds);
    if (profiles) {
      profilesMap = Object.fromEntries(profiles.map(p => [p.id, p as any]));
    }
  }

  return reports.map(r => ({
    ...r,
    reporter: profilesMap[r.reporter_id],
    reported_user: r.reported_user_id ? profilesMap[r.reported_user_id] : null,
    reason_label: REASON_LABEL[r.reason] || r.reason,
  }));
}

export default async function SikayetlerPage() {
  const reports = await getReports();
  const pending = reports.filter(r => r.status === 'pending');
  const handled = reports.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Flag className="w-6 h-6 text-red-400" /> Şikayetler
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {pending.length} bekleyen · {handled.length} işlenmiş
        </p>
      </div>

      {/* Bekleyen şikayetler */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5 bg-red-500/5">
          <h2 className="text-xs font-bold tracking-wider text-red-300">
            BEKLEYEN ({pending.length})
          </h2>
        </div>
        {pending.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Bekleyen şikayet yok 🎉</div>
        ) : (
          <div className="divide-y divide-white/5">
            {pending.map((r) => <ReportRow key={r.id} report={r} />)}
          </div>
        )}
      </div>

      {/* İşlenmiş geçmiş */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <h2 className="text-xs font-bold tracking-wider text-slate-400">
            GEÇMİŞ ({handled.length})
          </h2>
        </div>
        <div className="divide-y divide-white/5">
          {handled.slice(0, 30).map((r) => <ReportRow key={r.id} report={r} />)}
        </div>
      </div>
    </div>
  );
}
