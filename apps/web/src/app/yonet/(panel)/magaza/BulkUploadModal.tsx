"use client";

/**
 * BulkUploadModal — JSON dosyası veya yapıştırılan metinle toplu ürün ekleme.
 * Önce parse + validate, sonra önizleme, son olarak DB'ye toplu insert.
 */
import { useState, useRef } from 'react';
import { Upload, FileText, Check, AlertTriangle, Loader2, Copy, Download } from 'lucide-react';
import { CATEGORIES, getCategoryDef } from './categories';

type ParsedItem = {
  category: string;
  name: string;
  tagline?: string;
  art_emoji?: string;
  bg_gradient_start?: string;
  bg_gradient_end?: string;
  price_sp?: number;
  rarity?: string;
  is_featured?: boolean;
  active?: boolean;
};

type Phase = 'input' | 'preview' | 'uploading' | 'done';

const SAMPLE_JSON = JSON.stringify(
  [
    {
      category: 'frames',
      name: 'Altın Çerçeve',
      tagline: 'Premium efsane',
      art_emoji: '👑',
      bg_gradient_start: '#fbbf24',
      bg_gradient_end: '#78350f',
      price_sp: 500,
      rarity: 'legendary',
      is_featured: true,
    },
    {
      category: 'gift',
      name: 'Kırmızı Gül',
      art_emoji: '🌹',
      bg_gradient_start: '#ef4444',
      bg_gradient_end: '#7f1d1d',
      price_sp: 50,
      rarity: 'common',
    },
    {
      category: 'entry_effect',
      name: 'Şimşek Girişi',
      art_emoji: '⚡',
      bg_gradient_start: '#fbbf24',
      bg_gradient_end: '#92400e',
      price_sp: 250,
      rarity: 'rare',
    },
    {
      category: 'glow_message',
      name: 'Mor Parıltı',
      bg_gradient_start: '#a855f7',
      bg_gradient_end: '#3b0764',
      price_sp: 150,
      rarity: 'rare',
    },
  ],
  null,
  2,
);

export default function BulkUploadModal({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: (insertedCount: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>('input');
  const [jsonText, setJsonText] = useState('');
  const [parsed, setParsed] = useState<ParsedItem[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    inserted: number; skipped: number; total: number;
    errors: { index: number; error: string }[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      alert('Sadece .json dosyası yükleyebilirsin');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Dosya max 2MB olabilir');
      return;
    }
    const text = await file.text();
    setJsonText(text);
  };

  const handleParse = () => {
    setParseError(null);
    try {
      const parsedRaw = JSON.parse(jsonText);
      const items = Array.isArray(parsedRaw) ? parsedRaw : (Array.isArray(parsedRaw?.items) ? parsedRaw.items : null);
      if (!items) {
        setParseError('JSON bir dizi `[...]` veya `{ "items": [...] }` formatında olmalı');
        return;
      }
      if (items.length === 0) {
        setParseError('Liste boş');
        return;
      }
      if (items.length > 200) {
        setParseError(`Tek seferde max 200 ürün yüklenebilir (gönderilen: ${items.length})`);
        return;
      }
      setParsed(items);
      setPhase('preview');
    } catch (e: any) {
      setParseError(`JSON çözümlenemedi: ${e.message}`);
    }
  };

  const handleUpload = async () => {
    if (!parsed) return;
    setPhase('uploading');
    try {
      const res = await fetch('/yonet/api/store/items/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: parsed }),
      });
      const j = await res.json();
      setResult({
        inserted: j.inserted || 0,
        skipped: j.skipped || 0,
        total: j.total_input || parsed.length,
        errors: j.errors || [],
      });
      setPhase('done');
      if (j.inserted > 0) onUploaded(j.inserted);
    } catch (e: any) {
      setParseError(`Yükleme hatası: ${e.message}`);
      setPhase('preview');
    }
  };

  const handleExportExisting = async () => {
    try {
      const res = await fetch('/yonet/api/store/items/bulk');
      const j = await res.json();
      const blob = new Blob([JSON.stringify(j.items || [], null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `magaza-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Export başarısız: ' + e.message);
    }
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_JSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'magaza-ornek.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Önizleme — kategoriye göre dağılım
  const summary = parsed ? (() => {
    const counts = new Map<string, number>();
    for (const it of parsed) {
      const c = String(it.category || 'unknown');
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  })() : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-auto">
      <div className="bg-slate-900 border border-white/10 rounded-xl sm:rounded-2xl w-full max-w-3xl my-2 sm:my-8">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Upload className="w-5 h-5 text-cyan-400" />
              JSON ile Toplu Yükle
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {phase === 'input' && 'Dosya yükle veya JSON yapıştır'}
              {phase === 'preview' && `${parsed?.length || 0} ürün bulundu — onayla`}
              {phase === 'uploading' && 'Veritabanına yazılıyor...'}
              {phase === 'done' && 'Tamamlandı'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {phase === 'input' && (
            <div className="space-y-4">
              {/* Yardımcı butonlar */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Örnek JSON indir
                </button>
                <button
                  type="button"
                  onClick={handleExportExisting}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Mevcut katalog indir (yedek)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(SAMPLE_JSON);
                    alert('Örnek JSON panoya kopyalandı');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Örneği kopyala
                </button>
              </div>

              {/* Dosya yükleme */}
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-slate-400 mb-2">
                  YÖNTEMİ 1: DOSYA YÜKLE (.json)
                </label>
                <div
                  onDragOver={e => { e.preventDefault(); }}
                  onDrop={e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/15 rounded-xl p-6 text-center cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-colors"
                >
                  <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <div className="text-sm text-slate-300 font-semibold">JSON dosyasını sürükle veya tıkla</div>
                  <div className="text-[10px] text-slate-500 mt-1">Max 2 MB · max 200 ürün</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    aria-label="JSON dosyası seç"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Manuel yapıştırma */}
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-slate-400 mb-2">
                  YÖNTEMİ 2: JSON YAPIŞTIR
                </label>
                <textarea
                  value={jsonText}
                  onChange={e => setJsonText(e.target.value)}
                  placeholder='[{"category":"gift","name":"Kırmızı Gül","art_emoji":"🌹","price_sp":50}, ...]'
                  rows={8}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 focus:border-cyan-500/50 focus:outline-none text-[11px] font-mono text-slate-200 resize-y"
                />
              </div>

              {parseError && (
                <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-3 flex gap-2 text-sm text-red-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>{parseError}</div>
                </div>
              )}

              {/* JSON formatı yardımı */}
              <details className="text-xs">
                <summary className="text-slate-400 cursor-pointer hover:text-slate-300 font-semibold">
                  📖 JSON formatı nasıl olmalı?
                </summary>
                <div className="mt-2 space-y-2 text-slate-300 leading-relaxed">
                  <p>
                    Dosya bir <strong>dizi</strong> içermeli, her eleman bir ürün.
                    <strong className="text-emerald-300"> Sadece <code>category</code> ve <code>name</code> zorunlu</strong> — diğer alanlar otomatik doldurulur.
                  </p>
                  <div className="bg-black/40 rounded-lg p-3 font-mono text-[10px] overflow-auto max-h-60 whitespace-pre">
{`[
  {
    "category": "gift",        // zorunlu
    "name": "Kırmızı Gül",     // zorunlu
    "art_emoji": "🌹",
    "bg_gradient_start": "#ef4444",
    "bg_gradient_end": "#7f1d1d",
    "price_sp": 50,
    "rarity": "common"          // common | rare | epic | legendary | mythic
  }
]`}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    <strong>Geçerli kategoriler:</strong>{' '}
                    {CATEGORIES.map(c => <code key={c.slug} className="bg-white/5 px-1 rounded mx-0.5">{c.slug}</code>)}
                  </div>
                </div>
              </details>
            </div>
          )}

          {phase === 'preview' && parsed && (
            <div className="space-y-4">
              {/* Özet */}
              <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-300">{parsed.length} ürün hazır</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                  {summary.map(([cat, count]) => {
                    const def = getCategoryDef(cat);
                    return (
                      <div key={cat} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                        <div className="text-[10px] tracking-wider text-slate-500">{def.emoji} {def.label.toUpperCase()}</div>
                        <div className="text-lg font-bold text-slate-100">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* İlk 10 satır önizleme */}
              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-400 mb-2">
                  İLK 10 ÖRNEK (toplam {parsed.length})
                </div>
                <div className="bg-black/40 border border-white/10 rounded-lg overflow-auto max-h-60">
                  <table className="w-full text-[11px]">
                    <thead className="bg-white/[0.02] text-[9px] tracking-wider text-slate-500">
                      <tr>
                        <th className="text-left px-3 py-2">İSİM</th>
                        <th className="text-left px-3 py-2">KAT.</th>
                        <th className="text-right px-3 py-2">FİYAT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {parsed.slice(0, 10).map((it, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-slate-200">
                            {it.art_emoji && <span className="mr-1">{it.art_emoji}</span>}
                            {it.name}
                          </td>
                          <td className="px-3 py-2 text-slate-400">{getCategoryDef(it.category).label}</td>
                          <td className="px-3 py-2 text-right text-amber-300 font-mono">{(it.price_sp ?? 100).toLocaleString('tr-TR')} SP</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-200/80">
                <strong>Dikkat:</strong> Onayladığında bu ürünler kataloğa eklenir, mobil uygulamada kullanıcıların satın alımına açık olur. ID'ler otomatik üretilir.
              </div>
            </div>
          )}

          {phase === 'uploading' && (
            <div className="py-12 flex flex-col items-center gap-3 text-slate-300">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <span className="text-sm">Veritabanına yazılıyor...</span>
            </div>
          )}

          {phase === 'done' && result && (
            <div className="space-y-3">
              <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-6 h-6 text-emerald-400" />
                  <span className="text-lg font-bold text-emerald-300">Tamamlandı</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="bg-emerald-500/10 rounded-lg p-2">
                    <div className="text-2xl font-bold text-emerald-300">{result.inserted}</div>
                    <div className="text-[9px] text-emerald-200/60 tracking-wider">EKLENDİ</div>
                  </div>
                  <div className="bg-amber-500/10 rounded-lg p-2">
                    <div className="text-2xl font-bold text-amber-300">{result.skipped}</div>
                    <div className="text-[9px] text-amber-200/60 tracking-wider">ATLANDI</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="text-2xl font-bold text-slate-100">{result.total}</div>
                    <div className="text-[9px] text-slate-400 tracking-wider">TOPLAM</div>
                  </div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <details className="bg-red-500/5 border border-red-500/30 rounded-lg">
                  <summary className="px-3 py-2 cursor-pointer text-sm font-semibold text-red-300 hover:bg-red-500/10 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {result.errors.length} hata göster
                  </summary>
                  <div className="p-3 max-h-40 overflow-auto space-y-1 text-xs">
                    {result.errors.map((e, i) => (
                      <div key={i} className="text-red-300">
                        <strong>#{e.index + 1}:</strong> {e.error}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Aksiyon butonları */}
        <div className="px-5 py-4 border-t border-white/10 flex justify-end gap-2">
          {phase === 'input' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleParse}
                disabled={!jsonText.trim()}
                className="px-5 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-sm font-bold hover:bg-cyan-500/30 disabled:opacity-50 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> Çözümle ve Önizle
              </button>
            </>
          )}
          {phase === 'preview' && (
            <>
              <button
                type="button"
                onClick={() => setPhase('input')}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10"
              >
                Geri
              </button>
              <button
                type="button"
                onClick={handleUpload}
                className="px-5 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-sm font-bold hover:bg-emerald-500/30 flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Onayla ve Yükle ({parsed?.length})
              </button>
            </>
          )}
          {phase === 'done' && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-sm font-bold hover:bg-emerald-500/30"
            >
              Kapat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
