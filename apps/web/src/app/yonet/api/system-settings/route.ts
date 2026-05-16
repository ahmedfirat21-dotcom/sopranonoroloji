/**
 * ★ F-1 (16 May 2026): System settings update endpoint
 * POST /yonet/api/system-settings  body: { update: {...} }
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

const ALLOWED_FIELDS = new Set([
  'maintenance_mode',
  'maintenance_message',
  'maintenance_eta',
  'min_supported_version',
  'force_update',
  'force_update_message',
  'feature_flags',
  'banner_enabled',
  'banner_text',
  'banner_severity',
]);

export async function POST(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.update) return NextResponse.json({ error: 'update alanı eksik' }, { status: 400 });

  const safe: Record<string, any> = {};
  for (const k of Object.keys(body.update)) {
    if (ALLOWED_FIELDS.has(k)) safe[k] = body.update[k];
  }

  // banner_severity validation
  if (safe.banner_severity && !['info', 'warning', 'danger', 'success'].includes(safe.banner_severity)) {
    return NextResponse.json({ error: 'Geçersiz banner severity' }, { status: 400 });
  }

  // updated_by — şimdilik 'admin' (auth lib'de username çekme API'si yok)
  safe.updated_by = 'admin';
  safe.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('app_system_settings')
    .update(safe)
    .eq('id', 'default')
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  try {
    await supabaseAdmin.from('admin_audit_log').insert({
      action: 'system_settings_update',
      admin_username: safe.updated_by,
      payload: Object.keys(body.update),
    });
  } catch { /* audit fail safe */ }

  return NextResponse.json({ ok: true, settings: data, updated_at: safe.updated_at });
}
