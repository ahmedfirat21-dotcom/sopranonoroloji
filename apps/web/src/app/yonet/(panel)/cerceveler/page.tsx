/**
 * SopranoChat Admin — Çerçeve Editörü
 * Avatar frame Lottie'leri için drag-drop ayarları (avatarRatio, offset, glow vs.)
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Award, Settings, Plus } from 'lucide-react';
import Link from 'next/link';

async function loadFrames() {
  const { data } = await supabaseAdmin
    .from('cosmetic_items')
    .select('*')
    .in('category', ['frames', 'atelier'])
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  return data || [];
}

export default async function CerceveLerPage() {
  const items = await loadFrames();
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400" /> Çerçeve Editörü
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {items.length} çerçeve · Avatar oranı, konum, glow, sürekli animasyonlar
          </p>
        </div>
        <Link href="/yonet/cerceveler/yeni"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-medium shadow-lg shadow-violet-900/30">
          <Plus className="w-4 h-4" /> Yeni Çerçeve Oluştur
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item: any) => {
          const cfg = (item.editor_config as any)?.frame_config;
          return (
            <Link
              key={item.id}
              href={`/yonet/cerceveler/${item.id}`}
              className="group rounded-xl border border-slate-700/60 bg-slate-900/40 hover:border-amber-500/50 transition-colors p-4 block"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-100">{item.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  {item.price_sp} SP
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.tagline || '—'}</p>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="text-slate-400">ID: <code className="text-slate-300">{item.id}</code></span>
                {cfg ? (
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">Yapılandırıldı</span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">Default</span>
                )}
              </div>
              <div className="mt-3 flex items-center text-xs text-amber-400 group-hover:text-amber-300">
                <Settings className="w-3.5 h-3.5 mr-1" /> Düzenle
              </div>
            </Link>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-8 text-center text-slate-400">
          Henüz çerçeve yok.
        </div>
      )}
    </div>
  );
}
