/**
 * Oda Düzeni Editörü — Server Page (auth gated)
 * ════════════════════════════════════════════════════════════════════
 * v115 (13 May 2026) — Mobile app'in oda layout'unu (host/speakers/listeners/
 * stage/global) JSON config olarak yönetir. Frame editor mimarisi gibi:
 * DB → web admin slider → DB → mobile realtime apply.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import RoomLayoutEditor from './RoomLayoutEditor';
import { mergeWithDefaults } from './defaults';

export const dynamic = 'force-dynamic';

export default async function OdaDuzeniPage() {
  const { data } = await supabaseAdmin
    .from('room_layout_config')
    .select('*')
    .eq('id', 'default')
    .single();

  // ★ Eksik alanları DEFAULT ile doldur (DB v115 sonrası v116'da yeni alanlar eklendiyse)
  const safeInitial = { ...data, config: mergeWithDefaults(data?.config) };

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-3">
        <h1 className="text-xl font-semibold">Oda Düzeni</h1>
        <span className="text-xs text-slate-500">
          Mobile odanın görsel düzenini DB'den ince ayarla — değişiklikler kullanıcılara anında yansır.
        </span>
      </div>
      <RoomLayoutEditor initial={safeInitial} />
    </div>
  );
}
