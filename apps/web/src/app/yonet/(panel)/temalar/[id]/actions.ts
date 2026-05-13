'use server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/auth';
import { revalidatePath } from 'next/cache';

export async function saveThemeConfig(itemId: string, theme_config: Record<string, unknown>) {
  await requireAdmin();
  const { data: existing } = await supabaseAdmin
    .from('cosmetic_items').select('editor_config').eq('id', itemId).single();
  const next = { ...(existing?.editor_config || {}), theme_config };
  const { error } = await supabaseAdmin
    .from('cosmetic_items').update({ editor_config: next }).eq('id', itemId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/yonet/temalar/${itemId}`);
  return { ok: true as const };
}
