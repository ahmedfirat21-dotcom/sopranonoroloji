/**
 * SopranoChat Admin — Kullanıcılar
 * Search + ban/unban/verify/SP düzenleme.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Users } from 'lucide-react';
import UserSearchClient from './UserSearchClient';

async function loadInitial(query?: string) {
  let q = supabaseAdmin
    .from('profiles')
    .select('id, display_name, username, avatar_url, subscription_tier, is_admin, is_banned, is_verified, system_points, created_at, last_seen, last_active_at, is_online, lifetime_sp_donated')
    .order('created_at', { ascending: false })
    .limit(50);

  if (query) {
    q = q.or(`display_name.ilike.%${query}%,username.ilike.%${query}%`);
  }
  const { data, error } = await q;
  if (error || !data) return [];
  return data;
}

export default async function KullanicilarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const initial = await loadInitial(params.q);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-cyan-400" /> Kullanıcılar
        </h1>
        <p className="text-sm text-slate-400 mt-1">{initial.length} kullanıcı listede</p>
      </div>

      <UserSearchClient initialUsers={initial} initialQuery={params.q || ''} />
    </div>
  );
}
