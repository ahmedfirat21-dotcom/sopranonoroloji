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
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold">Oda Düzeni</h1>
          <span className="text-xs text-slate-500">
            Mobile odanın görsel düzenini DB'den ince ayarla.
          </span>
        </div>
        {/* APK senkron bilgi banner — kullanıcı her ayarın nasıl yansıdığını bilsin */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-teal-500/5 border border-teal-500/20 text-[11px] text-teal-200/90">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <div className="leading-relaxed">
            <span className="font-medium text-teal-100">Anında yansır:</span>{' '}
            Kaydet butonuna basınca <span className="font-mono text-cyan-200">room_layout_config</span> tablosu güncellenir,
            tüm mobil kullanıcılara Supabase realtime üzerinden anlık iletilir. Odada olan biri varsa görsel ayarlar yenilenir
            (yeniden başlatma gerekmez). Konuşmacı/dinleyici grid, host avatar, header rengi, alt kontrol bar, global arka plan
            — hepsi bu paneldeki ayarlardan beslenir.
          </div>
        </div>
      </div>
      <RoomLayoutEditor initial={safeInitial} />
    </div>
  );
}
