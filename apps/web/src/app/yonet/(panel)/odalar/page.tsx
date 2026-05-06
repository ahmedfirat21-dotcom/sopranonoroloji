/**
 * SopranoChat Admin — Odalar
 * Canlı odalar + kapalı odalar moderasyonu.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Home as HomeIcon } from 'lucide-react';
import RoomsClient from './RoomsClient';

async function loadRooms() {
  const { data: rooms, error } = await supabaseAdmin
    .from('rooms')
    .select('id, name, description, category, type, host_id, is_live, listener_count, max_speakers, language, mode, is_locked, is_persistent, total_gifts, created_at, expires_at, room_image_url')
    .order('is_live', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200);

  if (error || !rooms) return [];

  const hostIds = Array.from(new Set(rooms.map(r => r.host_id).filter(Boolean)));
  let hostMap: Record<string, { display_name: string; avatar_url: string }> = {};
  if (hostIds.length > 0) {
    const { data: hosts } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', hostIds);
    if (hosts) {
      hostMap = Object.fromEntries(hosts.map(h => [h.id, h as any]));
    }
  }
  return rooms.map(r => ({ ...r, host: r.host_id ? hostMap[r.host_id] : null }));
}

export default async function OdalarPage() {
  const rooms = await loadRooms();
  const live = rooms.filter(r => r.is_live);
  const closed = rooms.filter(r => !r.is_live);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <HomeIcon className="w-6 h-6 text-emerald-400" /> Odalar
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {live.length} canlı · {closed.length} kapalı
        </p>
      </div>

      <RoomsClient liveRooms={live} closedRooms={closed} />
    </div>
  );
}
