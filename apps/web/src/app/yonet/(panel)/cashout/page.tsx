/**
 * Para çekme istekleri yönetim sayfası.
 * Bekleyen istekler önce, sonra geçmiş.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Banknote } from 'lucide-react';
import CashoutClient from './CashoutClient';

async function loadInitial() {
  const { data, error } = await supabaseAdmin
    .from('cashout_requests')
    .select('id, user_id, amount, commission_rate, net_amount, status, admin_note, created_at, updated_at, profiles!cashout_requests_user_id_fkey(display_name, username, avatar_url, system_points, subscription_tier)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return [];
  return data || [];
}

export default async function CashoutPage() {
  const requests = await loadInitial();
  const pendingCount = requests.filter((r: any) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Banknote className="w-6 h-6 text-emerald-400" /> Para Çekme İstekleri
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {pendingCount > 0 ? (
            <span className="text-amber-300">⏳ {pendingCount} bekleyen istek</span>
          ) : (
            'Bekleyen istek yok.'
          )}
          {' '}· Toplam {requests.length} kayıt
        </p>
      </div>

      <CashoutClient initialRequests={requests as any} />
    </div>
  );
}
