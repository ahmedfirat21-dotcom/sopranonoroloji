/**
 * SopranoChat Admin — Push Bildirim
 * Toplu push gönderimi (broadcast / tier / tek kullanıcı).
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Bell } from 'lucide-react';
import PushClient from './PushClient';

async function loadStats() {
  const [{ count: tokenCount }, { count: userCount }] = await Promise.all([
    supabaseAdmin.from('push_tokens').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('push_tokens').select('user_id', { count: 'exact', head: true }),
  ]);

  // Distinct user count via simple query (head=true ile distinct yok, manuel sayım)
  const { data: distinctUsers } = await supabaseAdmin
    .from('push_tokens')
    .select('user_id');
  const distinct = new Set((distinctUsers || []).map(d => d.user_id)).size;

  return {
    totalTokens: tokenCount || 0,
    distinctUsers: distinct,
  };
}

export default async function PushPage() {
  const stats = await loadStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="w-6 h-6 text-fuchsia-400" /> Push Bildirim
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {stats.distinctUsers.toLocaleString('tr-TR')} aktif cihaz · {stats.totalTokens.toLocaleString('tr-TR')} token
        </p>
      </div>

      <PushClient totalTokens={stats.totalTokens} distinctUsers={stats.distinctUsers} />
    </div>
  );
}
