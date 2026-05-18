/**
 * Dashboard Stats API — Canlı veri için client polling endpoint'i.
 * /yonet sayfası bu endpoint'i 10 saniyede bir çağırarak metrikleri yeniler.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();

  const [
    usersRes,
    onlineNowRes,
    active5minRes,
    devicesRes,
    roomsLiveRes,
    messagesRes,
    reportsOpenRes,
    blockedRes,
    spTotalRes,
    newUsers24hRes,
    inactive14dRes,
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
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).lt('last_active_at', fourteenDaysAgo),
  ]);

  let spVolume24h = 0;
  if (spTotalRes.data) {
    for (const r of spTotalRes.data) spVolume24h += Math.abs((r as any).amount || 0);
  }

  // Push tokens — uniqueUsers cihazında app var demek
  const uniqueDeviceUsers = new Set<string>();
  if (devicesRes.data) {
    for (const r of devicesRes.data) {
      const uid = (r as any).user_id;
      if (uid) uniqueDeviceUsers.add(uid);
    }
  }

  const totalUsers = usersRes.count || 0;
  const installedDevices = uniqueDeviceUsers.size;
  // Muhtemelen silmiş = kayıt olmuş ama push token kayıtlı değil
  const probablyDeleted = Math.max(0, totalUsers - installedDevices);

  return NextResponse.json({
    users: totalUsers,
    onlineNow: onlineNowRes.count || 0,
    active5min: active5minRes.count || 0,
    installedDevices,
    totalPushTokens: devicesRes.data?.length || 0,
    probablyDeleted,
    inactive14d: inactive14dRes.count || 0,
    roomsLive: roomsLiveRes.count || 0,
    messages24h: messagesRes.count || 0,
    reportsOpen: reportsOpenRes.count || 0,
    blocked: blockedRes.count || 0,
    spVolume24h,
    newUsers24h: newUsers24hRes.count || 0,
    timestamp: Date.now(),
  });
}
