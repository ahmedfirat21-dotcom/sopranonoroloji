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
        {/* APK senkron bilgi banner */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-teal-500/5 border border-teal-500/20 text-[11px] text-teal-200/90">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <div className="leading-relaxed">
            <span className="font-medium text-teal-100">Anında yansır:</span>{' '}
            Kaydet butonuna basınca <span className="font-mono text-cyan-200">room_layout_config</span> tablosu güncellenir,
            tüm mobil kullanıcılara Supabase realtime üzerinden anlık iletilir. Odada olan biri varsa görsel ayarlar yenilenir
            (yeniden başlatma gerekmez).
          </div>
        </div>
        {/* Ekosistem ilişkisi banner — kullanıcının "frame ile çakışma" sorusunun cevabı */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-200/90">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 mt-0.5 shrink-0">
            <path d="M12 9v4M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div className="leading-relaxed">
            <span className="font-medium text-amber-100">Çakışma yok — öncelik mantığı:</span>{' '}
            Bu paneldeki ayarlar <span className="font-medium">tüm odalar için varsayılan (global default)</span>.
            Kullanıcının taktığı <span className="font-mono text-orange-200">çerçeve</span> (Mağaza → Çerçeveler) kendi
            avatar şekli/halo/pulse/isim ayarlarını taşırsa <span className="font-medium">o ayarlar ezer</span> —
            çerçeve sahibi kişi için. Çerçeve yoksa veya çerçevede o ayar tanımlı değilse buradaki değerler devreye girer.
            Bu sayede tek bir kullanıcının cosmetic seçimi diğer kullanıcıların görüntüsünü etkilemez, ama panel ayarı
            sadece "boş kanvas" üzerinde çalışır.
          </div>
        </div>
        {/* APK'da hangi alanlar aktif — şeffaflık için */}
        <details className="rounded-lg bg-slate-900/40 border border-slate-700/40 text-[11px]">
          <summary className="cursor-pointer select-none px-3 py-2 text-slate-300 font-medium hover:bg-white/5">
            APK'da hangi ayarlar şu an etkili? (tıkla)
          </summary>
          <div className="px-3 pb-3 pt-1 text-slate-400 leading-relaxed grid sm:grid-cols-2 gap-x-4 gap-y-1">
            <div><span className="text-emerald-400 font-mono">✓</span> Host — avatarShape, avatarSize, borderRadius, ring*, badgePosition</div>
            <div><span className="text-emerald-400 font-mono">✓</span> Speakers — avatarShape, maxCols, sizePresets, ring*, name*, mic icon</div>
            <div><span className="text-emerald-400 font-mono">✓</span> Listeners — avatarShape, maxCols, sizePresets, ownerCrown, ring*</div>
            <div><span className="text-emerald-400 font-mono">✓</span> Stage — backgroundColor, padding, gap</div>
            <div><span className="text-emerald-400 font-mono">✓</span> Global — bg (solid/gradient/image), bgGradient, bgColor, bgImageUrl</div>
            <div><span className="text-emerald-400 font-mono">✓</span> Header — title font/color, showListenerCount, headerBorder</div>
            <div><span className="text-emerald-400 font-mono">✓</span> Accents — ownerHighlight, ownerCrown</div>
            <div><span className="text-amber-400 font-mono">○</span> Controls — buton boyutu/renkleri (sonraki güncelleme)</div>
            <div><span className="text-amber-400 font-mono">○</span> Animations — pulse/transition (sonraki güncelleme)</div>
            <div><span className="text-amber-400 font-mono">○</span> Shadows — gölge ayarları (sonraki güncelleme)</div>
            <div><span className="text-amber-400 font-mono">○</span> Indicators — online dot, mute indicator (sonraki güncelleme)</div>
            <div><span className="text-amber-400 font-mono">○</span> Name advanced — text shadow, stroke (sonraki güncelleme)</div>
          </div>
        </details>
      </div>
      <RoomLayoutEditor initial={safeInitial} />
    </div>
  );
}
