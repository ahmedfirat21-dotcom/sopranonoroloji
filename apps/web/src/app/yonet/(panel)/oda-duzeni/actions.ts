'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/auth';
import { revalidatePath } from 'next/cache';

/**
 * Save room layout config.
 * ★ v289 (16 May 2026): Concurrency güvenliği eklendi.
 *   - .select() ile etkilenen satır geri döner; 0 satır = "default record yok"
 *     hatası fırlat (önce sessizce success dönüyordu).
 *   - DB updated_at zaten otomatik trigger ile güncellenir.
 *   - Concurrency (last-write-wins) hâlâ var ama tek admin'de problem yok.
 *     İki admin paralel kaydederse son save kazanır — küçük operasyonel risk.
 */
export async function saveRoomLayout(config: Record<string, unknown>) {
  await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from('room_layout_config')
    .update({ config })
    .eq('id', 'default')
    .select('id');
  if (error) return { ok: false as const, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false as const, error: 'default record bulunamadı — DB seed eksik' };
  }
  revalidatePath('/yonet/oda-duzeni');
  return { ok: true as const };
}
