/**
 * SopranoChat Admin Dashboard — Server Component
 * Üst düzey metrikler + son aktiviteler.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Users, Home, MessageSquare, Coins, Flag, AlertTriangle } from 'lucide-react';

async function getStats() {
  // Paralel sayım sorguları
  const [
    usersRes, roomsLiveRes, messagesRes, reportsOpenRes, blockedRes, spTotalRes,
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('rooms').select('*', { count: 'exact', head: true }).eq('is_live', true),
    supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString()),
    supabaseAdmin.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('blocked_users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('sp_transactions').select('amount').gte('created_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString()),
  ]);

  let spVolume24h = 0;
  if (spTotalRes.data) {
    for (const r of spTotalRes.data) spVolume24h += Math.abs((r as any).amount || 0);
  }

  return {
    users: usersRes.count || 0,
    roomsLive: roomsLiveRes.count || 0,
    messages24h: messagesRes.count || 0,
    reportsOpen: reportsOpenRes.count || 0,
    blocked: blockedRes.count || 0,
    spVolume24h,
  };
}

export default async function YonetDashboard() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel</h1>
        <p className="text-sm text-slate-400 mt-1">Genel durum ve son 24 saat ölçümleri</p>
      </div>

      {/* Top metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card icon={<Users className="w-5 h-5" />} label="Toplam Kullanıcı" value={fmt(stats.users)} accent="#22D3EE" />
        <Card icon={<Home className="w-5 h-5" />} label="Canlı Oda" value={fmt(stats.roomsLive)} accent="#22C55E" />
        <Card icon={<MessageSquare className="w-5 h-5" />} label="Son 24sa Mesaj" value={fmt(stats.messages24h)} accent="#A78BFA" />
        <Card icon={<Coins className="w-5 h-5" />} label="Son 24sa SP Hacmi" value={fmt(stats.spVolume24h)} accent="#FBBF24" />
        <Card icon={<Flag className="w-5 h-5" />} label="Bekleyen Şikayet" value={fmt(stats.reportsOpen)} accent="#EF4444" highlight={stats.reportsOpen > 0} />
        <Card icon={<AlertTriangle className="w-5 h-5" />} label="Toplam Engelleme" value={fmt(stats.blocked)} accent="#94A3B8" />
      </div>

      {/* Quick actions */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-sm font-bold tracking-wider text-slate-300 mb-4">HIZLI AKSİYONLAR</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <a href="/yonet/sikayetler" className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-colors">
            <div className="font-semibold text-red-300">Şikayetleri İncele</div>
            <div className="text-xs text-red-400/70 mt-0.5">{stats.reportsOpen} bekleyen</div>
          </a>
          <a href="/yonet/kullanicilar" className="px-4 py-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors">
            <div className="font-semibold text-cyan-300">Kullanıcı Yönetimi</div>
            <div className="text-xs text-cyan-400/70 mt-0.5">Ban / Doğrulama / SP</div>
          </a>
          <a href="/yonet/odalar" className="px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors">
            <div className="font-semibold text-green-300">Canlı Odalar</div>
            <div className="text-xs text-green-400/70 mt-0.5">{stats.roomsLive} aktif</div>
          </a>
          <a href="/yonet/magaza" className="px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors">
            <div className="font-semibold text-amber-300">Mağaza</div>
            <div className="text-xs text-amber-400/70 mt-0.5">Ürün/Set ekle</div>
          </a>
        </div>
      </div>
    </div>
  );
}

function Card({ icon, label, value, accent, highlight }: {
  icon: React.ReactNode; label: string; value: string; accent: string; highlight?: boolean;
}) {
  return (
    <div
      className={`relative bg-white/5 border rounded-2xl p-5 transition-colors ${
        highlight ? 'border-red-500/40 bg-red-500/5' : 'border-white/10'
      }`}
    >
      <div
        className="absolute top-0 left-6 right-6 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-100">{value}</div>
      <div className="text-xs text-slate-400 mt-1 tracking-wide">{label}</div>
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString('tr-TR');
}
