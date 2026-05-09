/**
 * POST /api/yonet/entry-effects/:id
 * cosmetic_items.editor_config.entry_config'i günceller (JSONB).
 * NOT: meta TEXT olduğu için kullanılmaz; editor_config yeni JSONB kolonu.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body?.entry_config) {
    return NextResponse.json({ error: 'entry_config gerekli' }, { status: 400 });
  }

  const { data: existing, error: getErr } = await supabaseAdmin
    .from('cosmetic_items')
    .select('editor_config')
    .eq('id', id)
    .eq('category', 'entry_effect')
    .single();
  if (getErr) {
    return NextResponse.json({ error: getErr.message }, { status: 404 });
  }
  const newConfig = { ...((existing?.editor_config as any) || {}), entry_config: body.entry_config };

  const { error: updErr } = await supabaseAdmin
    .from('cosmetic_items')
    .update({ editor_config: newConfig })
    .eq('id', id);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, editor_config: newConfig });
}
