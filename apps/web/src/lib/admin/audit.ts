/**
 * Admin audit logger — DB tablosuna + Vercel Logs'a yazar.
 * DB: public.admin_audit_log (UI'dan filtrelenebilir)
 * Console: [ADMIN_AUDIT] prefix (Vercel log explorer'da)
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { headers, cookies } from 'next/headers';

type AuditEntry = {
  action: string;
  target_type?: string;
  target_id?: string;
  payload?: Record<string, any>;
};

/**
 * Admin işlemini log'la — fire-and-forget, hata olsa bile ana akışı bloklamaz.
 * Server tarafından çağrılır (route handler içinde).
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  // Async ama await edilmesine gerek yok (hata main flow'u bozmasın)
  void writeAudit(entry);
}

async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    let ip = '';
    let userAgent = '';
    let adminUsername = '';
    try {
      const h = await headers();
      ip = h.get('x-forwarded-for') || h.get('x-real-ip') || '';
      userAgent = h.get('user-agent') || '';
      const cookieStore = await cookies();
      adminUsername = cookieStore.get('admin_username')?.value || 'admin';
    } catch {
      // Server context yoksa sessiz
    }

    // Console
    console.log('[ADMIN_AUDIT]', JSON.stringify({
      ts: new Date().toISOString(),
      admin: adminUsername,
      ...entry,
      ip,
    }));

    // DB
    await supabaseAdmin.from('admin_audit_log').insert({
      admin_username: adminUsername,
      action: entry.action,
      target_type: entry.target_type || null,
      target_id: entry.target_id || null,
      payload: entry.payload || null,
      ip: ip || null,
      user_agent: userAgent || null,
    });
  } catch (e) {
    // Audit fail olursa flow'u bozma; sadece console'a düş
    console.error('[ADMIN_AUDIT] write failed:', (e as any)?.message);
  }
}
