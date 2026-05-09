/**
 * POST /api/yonet/frames/:id
 * cosmetic_items.editor_config.frame_config'i günceller (JSONB).
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body?.frame_config) {
    return NextResponse.json({ error: 'frame_config gerekli' }, { status: 400 });
  }
  const { data: existing } = await supabaseAdmin
    .from('cosmetic_items')
    .select('editor_config')
    .eq('id', id)
    .single();
  const newConfig = { ...((existing?.editor_config as any) || {}), frame_config: body.frame_config };
  const { error } = await supabaseAdmin.from('cosmetic_items').update({ editor_config: newConfig }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, editor_config: newConfig });
}
