/**
 * Oda Düzeni Editörü — Server Page (auth gated)
 * ════════════════════════════════════════════════════════════════════
 * v286 (16 May 2026): "Tek vücut" temizliği — sadece APK'da gerçekten
 * render edilen ayarlar panelde gösterilir. 21 disconnected section
 * gizlendi (types/defaults DB schema dokunulmadı, post-launch tekrar
 * açılabilir). Artık her slider/toggle anında mobile'a yansır.
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

        {/* ★ Tek vücut banner — kaydedilen her şey anında APK'ya yansır */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/30 text-[11px] text-emerald-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
          </svg>
          <div className="leading-relaxed">
            <span className="font-semibold text-emerald-200">Tek vücut — her ayar anında APK'da görünür.</span>{' '}
            Bu paneldeki tüm slider/toggle/renk seçici mobil oda render'ına bağlı.
            <span className="font-mono text-cyan-200"> Kaydet</span> → <span className="font-mono text-cyan-200">room_layout_config</span> tablosu güncellenir,
            Supabase realtime ile odadaki tüm kullanıcılara saniyeler içinde iletilir (uygulamayı yeniden başlatmaya gerek yok).
          </div>
        </div>

        {/* Frame ↔ Layout öncelik kuralı — kullanıcının "çakışma" sorusunun cevabı */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-200/90">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 mt-0.5 shrink-0">
            <path d="M12 9v4M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div className="leading-relaxed">
            <span className="font-medium text-amber-100">Çakışma yok — öncelik mantığı:</span>{' '}
            Bu paneldeki ayarlar <span className="font-medium">tüm odalar için varsayılan (global default)</span>.
            Kullanıcı kendi <span className="font-mono text-orange-200">çerçevesini</span> (Mağaza → Çerçeveler) taktıysa,
            çerçeve içindeki ayarlar (avatar şekli, halo, isim göster) <span className="font-medium">o kişi için</span> bu varsayılanı ezer.
          </div>
        </div>

        {/* Post-launch panel kapsamı — şeffaflık */}
        <details className="rounded-lg bg-slate-900/40 border border-slate-700/40 text-[11px]">
          <summary className="cursor-pointer select-none px-3 py-2 text-slate-300 font-medium hover:bg-white/5">
            Bu panel hangi mobile component'lere bağlı? (tıkla)
          </summary>
          <div className="px-3 pb-3 pt-1 text-slate-400 leading-relaxed grid sm:grid-cols-2 gap-x-4 gap-y-1">
            <div><span className="text-emerald-400 font-mono">→</span> Host avatar → <span className="font-mono">SpeakerSection</span></div>
            <div><span className="text-emerald-400 font-mono">→</span> Konuşmacı avatarı → <span className="font-mono">SpeakerSection</span></div>
            <div><span className="text-emerald-400 font-mono">→</span> Dinleyici avatar/halka/isim → <span className="font-mono">ListenerGrid</span></div>
            <div><span className="text-emerald-400 font-mono">→</span> Owner taç + vurgu → <span className="font-mono">ListenerGrid</span></div>
            <div><span className="text-emerald-400 font-mono">→</span> Oda başlığı → <span className="font-mono">RoomInfoHeader</span></div>
            <div><span className="text-emerald-400 font-mono">→</span> Alt bar buton/ikon → <span className="font-mono">RoomControlBar</span></div>
            <div><span className="text-emerald-400 font-mono">→</span> Sayfa padding → <span className="font-mono">app/room/[id].tsx</span></div>
            <div className="sm:col-span-2 text-slate-500 pt-1 border-t border-slate-700/40 mt-1">
              <span className="text-slate-400">Henüz açık değil (post-launch):</span> Stage/Animations/Shadows/Indicators/Speakers&Listeners advanced/Name advanced.
              Bu bölümler types.ts'te + DB'de durur, mobile bağlama yapıldığında tek satır eklenerek panele geri döner.
            </div>
          </div>
        </details>
      </div>
      <RoomLayoutEditor initial={safeInitial} />
    </div>
  );
}
