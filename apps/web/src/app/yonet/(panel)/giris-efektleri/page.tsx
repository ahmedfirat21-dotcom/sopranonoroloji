/**
 * SopranoChat Admin — Giriş Efektleri Editörü
 * Lottie + avatar entegrasyonu için sürükle-bırak çalışma alanı.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Sparkles, Settings } from 'lucide-react';
import Link from 'next/link';

async function loadEntryEffects() {
  const { data } = await supabaseAdmin
    .from('cosmetic_items')
    .select('*')
    .eq('category', 'entry_effect')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  return data || [];
}

export default async function GirisEfektleriPage() {
  const items = await loadEntryEffects();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-fuchsia-400" /> Giriş Efektleri Editörü
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {items.length} efekt · Avatar pozisyonu, boyut, metin ayarları, oda simülasyonu
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item: any) => {
          const cfg = (item.editor_config as any)?.entry_config;
          const hasAvatar = cfg?.has_avatar === true;
          return (
            <Link
              key={item.id}
              href={`/yonet/giris-efektleri/${item.id}`}
              className="group rounded-xl border border-slate-700/60 bg-slate-900/40 hover:border-fuchsia-500/50 transition-colors p-4 block"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-100">{item.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  {item.price_sp} SP
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.tagline || '—'}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">ID: <code className="text-slate-300">{item.id}</code></span>
                {hasAvatar && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Avatar entegre
                  </span>
                )}
                {cfg ? (
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    Yapılandırıldı
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                    Default
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center text-xs text-fuchsia-400 group-hover:text-fuchsia-300">
                <Settings className="w-3.5 h-3.5 mr-1" /> Düzenle
              </div>
            </Link>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-8 text-center text-slate-400">
          Henüz giriş efekti yok. Mağaza üzerinden ekleyebilirsin.
        </div>
      )}
    </div>
  );
}
