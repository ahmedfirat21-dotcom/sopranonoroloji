'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/auth';
import { revalidatePath } from 'next/cache';

export async function saveGlowMessageConfig(itemId: string, glow_config: Record<string, unknown>) {
  await requireAdmin();
  // editor_config.glow_config içine yaz (cosmetic_items.editor_config JSONB)
  const { data: existing } = await supabaseAdmin
    .from('cosmetic_items')
    .select('editor_config')
    .eq('id', itemId)
    .single();
  const next = { ...(existing?.editor_config || {}), glow_config };
  const { error } = await supabaseAdmin
    .from('cosmetic_items')
    .update({ editor_config: next })
    .eq('id', itemId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/yonet/parlak-mesajlar/${itemId}`);
  return { ok: true as const };
}
