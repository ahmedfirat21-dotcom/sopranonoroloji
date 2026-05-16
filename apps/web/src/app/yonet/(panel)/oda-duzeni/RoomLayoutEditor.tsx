"use client";

/**
 * Oda Düzeni Editör — 6 sekme + 100+ ayar + canlı önizleme
 * ════════════════════════════════════════════════════════════════════
 * Layout: SOL = ayar paneli (scroll), SAĞ = sticky preview.
 * State: tek üst seviye reducer, functional update — stale closure yok.
 */
import React, { useReducer, useTransition } from 'react';
import { Save, RotateCcw, Crown, Mic, Users, LayoutPanelTop, Loader2 } from 'lucide-react';
import { saveRoomLayout } from './actions';
import { HostPanel, SpeakersPanel, ListenersPanel, HeaderControlsPanel } from './panels';
import { RoomPreview } from './preview';
import { mergeWithDefaults } from './defaults';
import type { RoomLayoutConfig } from './types';

type Tab = 'host' | 'speakers' | 'listeners' | 'chrome';

// ── Reducer: tek action tipi, group + partial patch ──
type Group = keyof RoomLayoutConfig;
type Action = { group: Group; patch: any } | { reset: true; value: RoomLayoutConfig };

function reducer(state: RoomLayoutConfig, action: Action): RoomLayoutConfig {
  if ('reset' in action) return action.value;
  return { ...state, [action.group]: { ...state[action.group], ...action.patch } };
}

export default function RoomLayoutEditor({ initial }: { initial: any }) {
  const [cfg, dispatch] = useReducer(reducer, initial?.config, mergeWithDefaults);
  const [tab, setTab] = React.useState<Tab>('host');
  const [saving, startSave] = useTransition();
  const [status, setStatus] = React.useState<string | null>(null);
  // ★ Mock sayıları — önizlemenin hangi preset aralığını test edeceğini belirler
  const [mockSpeakers, setMockSpeakers] = React.useState(4);
  const [mockListeners, setMockListeners] = React.useState(9);

  const upd = (group: Group) => (patch: any) => dispatch({ group, patch });

  const handleSave = () => {
    setStatus(null);
    startSave(async () => {
      const res = await saveRoomLayout(cfg as any);
      setStatus(res.ok ? '✓ Kaydedildi — mobile anında uygulanır.' : `✗ Hata: ${res.error}`);
      setTimeout(() => setStatus(null), 3500);
    });
  };

  // ★ v283 (16 May 2026): "Sıfırla" artık fabrika varsayılanına döner — DB'deki son
  //   state'e değil. defaults.ts içindeki DEFAULT_ROOM_LAYOUT (mergeWithDefaults(undefined))
  //   tüm slider/toggle/renkleri sıfırdan kurulan değerlere çeker. Kaydet butonuna
  //   bastığında DB'ye yazılır → mobile'a anında uygulanır.
  const handleReset = () => {
    if (!confirm("Tüm ayarlar fabrika varsayılanına dönecek. Kaydet'e basana kadar DB değişmez. Emin misin?")) return;
    dispatch({ reset: true, value: mergeWithDefaults(undefined) });
  };

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'host',      label: 'Host',         icon: <Crown className="w-3.5 h-3.5" /> },
    { key: 'speakers',  label: 'Konuşmacılar', icon: <Mic className="w-3.5 h-3.5" /> },
    { key: 'listeners', label: 'Dinleyiciler', icon: <Users className="w-3.5 h-3.5" /> },
    { key: 'chrome',    label: 'Başlık & Bar', icon: <LayoutPanelTop className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-4 items-start">
      {/* SOL: Ayar paneli — esnek genişlik */}
      <div className="flex-1 min-w-0 w-full space-y-3">
        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-slate-900/50 border border-slate-700/40 rounded-xl p-1 overflow-x-auto sticky top-0 z-10 backdrop-blur">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                tab === t.key
                  ? 'bg-gradient-to-r from-teal-500/30 to-cyan-500/20 text-cyan-100 border border-teal-500/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab içerik */}
        <div className="pb-20">
          {tab === 'host' && (
            <HostPanel cfg={cfg.host} update={upd('host')} />
          )}
          {tab === 'speakers' && (
            <SpeakersPanel cfg={cfg.speakers} updateCfg={upd('speakers')} />
          )}
          {tab === 'listeners' && (
            <ListenersPanel cfg={cfg.listeners} accents={cfg.accents} updateCfg={upd('listeners')} updateAccents={upd('accents')} />
          )}
          {tab === 'chrome' && (
            <HeaderControlsPanel
              global={cfg.global} header={cfg.header} controls={cfg.controls}
              updateGlobal={upd('global')} updateHeader={upd('header')} updateControls={upd('controls')}
            />
          )}
        </div>

        {/* Aksiyon barı — sayfa altında sabit */}
        <div className="fixed left-0 right-0 bottom-0 z-50 border-t border-slate-700/50 bg-slate-950/90 backdrop-blur px-4 py-3 lg:left-64">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Varsayılana Sıfırla
            </button>
            <div className="flex items-center gap-3">
              {status && (
                <span className={`text-xs ${status.startsWith('✗') ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {status}
                </span>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30 hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SAĞ: Canlı önizleme — sticky */}
      <div className="w-full xl:w-[360px] xl:sticky xl:top-4 xl:self-start shrink-0">
        <div className="rounded-xl border border-slate-700/40 bg-slate-900/30 p-3">
          <div className="text-xs text-slate-300 mb-2 flex items-center justify-between">
            <span className="font-medium">Canlı Önizleme</span>
            <span className="text-[10px] text-slate-500">Mobile-eş hesap</span>
          </div>
          <RoomPreview cfg={cfg} speakerCount={mockSpeakers} listenerCount={mockListeners} />
          {/* Mock kişi sayısı kontrolü — preset aralıkları için */}
          <div className="mt-3 pt-2 border-t border-slate-700/40 space-y-2">
            <div className="text-[10px] text-slate-400">Önizleme Mock</div>
            <label className="block">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Konuşmacı (host dahil)</span>
                <span className="font-mono text-slate-200">{mockSpeakers}</span>
              </div>
              <input type="range" min={1} max={15} step={1} value={mockSpeakers}
                onChange={(e) => setMockSpeakers(parseInt(e.target.value, 10))}
                className="w-full accent-teal-500" />
            </label>
            <label className="block">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Dinleyici</span>
                <span className="font-mono text-slate-200">{mockListeners}</span>
              </div>
              <input type="range" min={0} max={30} step={1} value={mockListeners}
                onChange={(e) => setMockListeners(parseInt(e.target.value, 10))}
                className="w-full accent-teal-500" />
            </label>
            <div className="text-[10px] text-emerald-500/70 leading-relaxed">
              Boyut presetları kişi sayısı aralığına bağlı. Konuşmacı 1-3=Büyük · 4-9=Orta · 10+=Küçük · Dinleyici 1-4=Büyük · 5-8=Orta · 9+=Küçük.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
