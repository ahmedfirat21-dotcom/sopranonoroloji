'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/auth';
import { revalidatePath } from 'next/cache';

export async function saveRoomLayout(config: Record<string, unknown>) {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from('room_layout_config')
    .update({ config })
    .eq('id', 'default');
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/yonet/oda-duzeni');
  return { ok: true as const };
}
