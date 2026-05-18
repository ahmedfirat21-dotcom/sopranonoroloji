/**
 * SopranoChat Admin Dashboard — 3 ana metrik (İndiren / Online / Pasif Yüklü)
 * gerçek zamanlı, 10 sn'de bir yenilenir.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import LiveStatsCards from './LiveStatsCards';

async function getInitialStats() {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const [
    usersRes, onlineNowRes, active5minRes, devicesRes,
    roomsLiveRes, messagesRes, reportsOpenRes, blockedRes, spTotalRes, newUsers24hRes,
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('is_online', true),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).gte('last_active_at', fiveMinAgo),
    supabaseAdmin.from('push_tokens').select('user_id'),
    supabaseAdmin.from('rooms').select('*', { count: 'exact', head: true }).eq('is_live', true),
    supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', dayAgo),
    supabaseAdmin.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('blocked_users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('sp_transactions').select('amount').gte('created_at', dayAgo),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', dayAgo),
  ]);

  let spVolume24h = 0;
  if (spTotalRes.data) {
    for (const r of spTotalRes.data) spVolume24h += Math.abs((r as any).amount || 0);
  }

  const uniqueDeviceUsers = new Set<string>();
  if (devicesRes.data) {
    for (const r of devicesRes.data) {
      const uid = (r as any).user_id;
      if (uid) uniqueDeviceUsers.add(uid);
    }
  }

  return {
    users: usersRes.count || 0,
    onlineNow: onlineNowRes.count || 0,
    active5min: active5minRes.count || 0,
    installedDevices: uniqueDeviceUsers.size,
    totalPushTokens: devicesRes.data?.length || 0,
    roomsLive: roomsLiveRes.count || 0,
    messages24h: messagesRes.count || 0,
    reportsOpen: reportsOpenRes.count || 0,
    blocked: blockedRes.count || 0,
    spVolume24h,
    newUsers24h: newUsers24hRes.count || 0,
    timestamp: Date.now(),
  };
}

export const dynamic = 'force-dynamic';

export default async function YonetDashboard() {
  const stats = await getInitialStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel</h1>
        <p className="text-sm text-slate-400 mt-1">Genel durum ve canlı metrikler</p>
      </div>

      <LiveStatsCards initial={stats} />

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
