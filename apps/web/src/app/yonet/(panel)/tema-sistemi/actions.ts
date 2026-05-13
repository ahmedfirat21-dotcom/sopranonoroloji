'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/auth';
import { revalidatePath } from 'next/cache';

export async function saveAppTheme(config: Record<string, unknown>) {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from('app_theme_config')
    .update({ config })
    .eq('id', 'default');
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/yonet/tema-sistemi');
  return { ok: true as const };
}
