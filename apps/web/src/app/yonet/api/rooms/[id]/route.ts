import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/admin/audit';

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

const TIER_LIMITS: Record<string, { maxSpeakers: number; maxListeners: number; maxCameras: number }> = {
  Free: { maxSpeakers: 4, maxListeners: 50, maxCameras: 2 },
  Plus: { maxSpeakers: 8, maxListeners: 200, maxCameras: 4 },
  Pro: { maxSpeakers: 16, maxListeners: 1000, maxCameras: 8 },
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body?.action;

  // Odayı kapat (soft) — is_live=false
  if (action === 'close') {
    const { error } = await supabaseAdmin
      .from('rooms')
      .update({ is_live: false, expires_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logAudit({ action: 'room_close', target_type: 'room', target_id: id });
    return NextResponse.json({ ok: true });
  }

  // Odayı kalıcı sil (cascade RPC)
  if (action === 'delete') {
    const { error } = await supabaseAdmin.rpc('admin_delete_room', { p_room_id: id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logAudit({ action: 'room_delete', target_type: 'room', target_id: id });
    return NextResponse.json({ ok: true });
  }

  // Uyuyan odayı uyandır — is_live=true, expires_at sıfırla, frozen settings temizle
  if (action === 'wake') {
    const { data: existing } = await supabaseAdmin
      .from('rooms')
      .select('room_settings, owner_tier')
      .eq('id', id)
      .maybeSingle();

    const settings: any = { ...((existing?.room_settings as any) || {}) };
    delete settings.remaining_ms;
    delete settings.frozen_at;
    delete settings.original_host_id;

    const tier = (existing?.owner_tier as string) || 'Free';
    const hours = tier === 'Pro' ? null : tier === 'Plus' ? 8 : 1;
    const newExpires = hours === null ? null : new Date(Date.now() + hours * 3600_000).toISOString();

    const { error } = await supabaseAdmin
      .from('rooms')
      .update({
        is_live: true,
        created_at: new Date().toISOString(),
        expires_at: newExpires,
        room_settings: settings,
      })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logAudit({ action: 'room_wake', target_type: 'room', target_id: id, payload: { tier, hours } });
    return NextResponse.json({ ok: true });
  }

  // Tier değiştir — owner_tier + max_speakers/listeners/cameras
  if (action === 'change_tier') {
    const tier = String(body.tier || '');
    if (!['Free', 'Plus', 'Pro'].includes(tier)) {
      return NextResponse.json({ error: 'Geçersiz tier' }, { status: 400 });
    }
    const limits = TIER_LIMITS[tier];
    const { error } = await supabaseAdmin
      .from('rooms')
      .update({
        owner_tier: tier,
        max_speakers: limits.maxSpeakers,
        max_listeners: limits.maxListeners,
        max_cameras: limits.maxCameras,
      })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logAudit({ action: 'room_tier_change', target_type: 'room', target_id: id, payload: { tier } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Geçersiz aksiyon' }, { status: 400 });
}
