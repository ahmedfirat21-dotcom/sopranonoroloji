"use client";

// ═══════════════════════════════════════════════════════
// SopranoChat — Mağaza Görseli Üretici
// App Store / Google Play Screenshot Generator
//
// Sadece dev ortamında: localhost:3000/screenshots
// Tarayıcıda aç → Ekran görüntüsü al → Mağazaya yükle
// ═══════════════════════════════════════════════════════

/* ─── Phone Frame ─── */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[220px] rounded-[2.2rem] border-2 border-white/[0.08] p-2 bg-gradient-to-b from-[#0c1428] to-[#060a16] shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-[#040810] rounded-b-xl z-10" />
      {/* Screen */}
      <div className="rounded-[1.8rem] overflow-hidden bg-[#080e1e] aspect-[9/19.5]">
        {children}
      </div>
    </div>
  );
}

/* ─── Screenshot Canvas ─── */
function ScreenshotCanvas({
  title,
  subtitle,
  gradientFrom,
  gradientVia,
  children,
}: {
  title: string;
  subtitle?: string;
  gradientFrom: string;
  gradientVia: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative flex-shrink-0 flex flex-col items-center justify-between overflow-hidden"
      style={{
        width: 414,
        height: 896,
        background: `linear-gradient(160deg, ${gradientFrom}, #040810 40%, ${gradientVia}, #040810 90%)`,
      }}
    >
      {/* Ambient orbs */}
      <div className="absolute top-[-80px] left-[-60px] w-[300px] h-[300px] rounded-full opacity-30 pointer-events-none" style={{ background: gradientFrom, filter: 'blur(100px)' }} />
      <div className="absolute bottom-[-60px] right-[-40px] w-[250px] h-[250px] rounded-full opacity-20 pointer-events-none" style={{ background: gradientVia, filter: 'blur(100px)' }} />

      {/* Title */}
      <div className="relative z-10 pt-16 px-8 text-center">
        <h2 className="text-[28px] font-extrabold text-white leading-[1.15] tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[14px] text-white/40 mt-3 font-light leading-relaxed">{subtitle}</p>
        )}
      </div>

      {/* Phone */}
      <div className="relative z-10 mt-6 mb-10">
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════

export default function ScreenshotsPage() {
  return (
    <main className="min-h-screen bg-[#020408] p-10">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-white/60">SopranoChat — Mağaza Görselleri</h1>
        <p className="text-sm text-white/30 mt-1">Her bir tuvali kırparak mağazaya yükleyin (414 × 896)</p>
      </div>

      <div className="flex items-start justify-center gap-8 flex-wrap">
        {/* ═══ 1. KENDI LOCANI KUR ═══ */}
        <ScreenshotCanvas
          title="KENDİ LOCANI KUR"
          subtitle="VIP mekanını yarat, kuralları sen koy"
          gradientFrom="#0E3D69"
          gradientVia="#1A0A3E"
        >
          <PhoneFrame>
            <div className="relative h-full bg-gradient-to-b from-cyan-900/20 via-transparent to-purple-900/10 p-4 pt-8">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 border border-cyan-400/20 flex items-center justify-center mb-3">
                  <svg width="28" height="28" fill="none" stroke="#5CE1E6" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 6v12M6 12h12" strokeLinecap="round"/></svg>
                </div>
                <div className="text-[10px] font-bold text-white/80">Loca Oluştur</div>
              </div>

              {/* Form fields */}
              <div className="space-y-3">
                <div className="h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center px-3">
                  <span className="text-[8px] text-white/30">Loca adı giriniz...</span>
                </div>
                <div className="h-16 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-start p-2">
                  <span className="text-[8px] text-white/30">Açıklama ekleyin...</span>
                </div>

                {/* Category chips */}
                <div className="flex flex-wrap gap-1.5">
                  {['🎵 Müzik', '💬 Sohbet', '🎮 Oyun'].map(c => (
                    <div key={c} className="px-2.5 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/15">
                      <span className="text-[7px] text-cyan-300/80">{c}</span>
                    </div>
                  ))}
                </div>

                {/* Toggle */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-[8px] text-white/50">VIP Erişim</span>
                  <div className="w-8 h-4 rounded-full bg-cyan-400/40 flex items-center justify-end px-0.5">
                    <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(92,225,230,0.5)]" />
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="absolute bottom-6 left-4 right-4">
                <div className="h-10 rounded-2xl bg-gradient-to-r from-cyan-400 to-cyan-600 flex items-center justify-center shadow-[0_0_20px_rgba(92,225,230,0.3)]">
                  <span className="text-[10px] font-bold text-[#040810]">Locayı Kur</span>
                </div>
              </div>
            </div>
          </PhoneFrame>
        </ScreenshotCanvas>

        {/* ═══ 2. OTORİTE SENDE ═══ */}
        <ScreenshotCanvas
          title="OTORİTE SENDE"
          subtitle="Vizeleri belirle, yetki sat, ekonomini yönet"
          gradientFrom="#1A3A12"
          gradientVia="#0A1E3E"
        >
          <PhoneFrame>
            <div className="relative h-full bg-gradient-to-b from-cyan-900/15 via-transparent to-emerald-900/10 p-4 pt-8">
              {/* Tab pills */}
              <div className="flex gap-1 mb-4 p-0.5 rounded-full bg-white/[0.04] border border-white/[0.05]">
                <div className="flex-1 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 flex items-center justify-center">
                  <span className="text-[7px] font-bold text-[#040810]">Mülkiyet Yetkileri</span>
                </div>
                <div className="flex-1 h-6 rounded-full flex items-center justify-center">
                  <span className="text-[7px] text-white/40">Lüks Koleksiyon</span>
                </div>
              </div>

              {/* Visa cards */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Mikrofon Vizesi', price: '500', icon: '🎤', glow: 'cyan' },
                  { name: 'DJ Koltuğu', price: '750', icon: '🎵', glow: 'purple' },
                  { name: 'VIP Koltuk', price: '1.200', icon: '🛡️', glow: 'yellow' },
                  { name: 'Moderatör', price: '2.000', icon: '⚡', glow: 'cyan' },
                ].map(v => (
                  <div key={v.name} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 text-center">
                    <div className="text-lg mb-1">{v.icon}</div>
                    <div className="text-[8px] font-semibold text-white/80">{v.name}</div>
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                      <span className="text-[7px] text-cyan-400 font-bold">{v.price}</span>
                      <svg width="8" height="8" fill="#5CE1E6" viewBox="0 0 24 24"><path d="M6 3h12l4 7-10 11L2 10l4-7z"/></svg>
                    </div>
                  </div>
                ))}
              </div>

              {/* Purchase button */}
              <div className="mt-4">
                <div className="h-9 rounded-xl bg-gradient-to-r from-cyan-400/20 to-cyan-600/20 border border-cyan-400/20 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-cyan-400">Yetki Satın Al</span>
                </div>
              </div>
            </div>
          </PhoneFrame>
        </ScreenshotCanvas>

        {/* ═══ 3. ELİTLERİN ARASINA KATIL ═══ */}
        <ScreenshotCanvas
          title="ELİTLERİN ARASINA KATIL"
          subtitle="Sıralamada zirveye otur, statünü göster"
          gradientFrom="#3D2A0E"
          gradientVia="#0E1A3D"
        >
          <PhoneFrame>
            <div className="relative h-full bg-gradient-to-b from-yellow-900/15 via-transparent to-cyan-900/10 p-4 pt-8">
              {/* Filter tabs */}
              <div className="flex gap-1 mb-4">
                <div className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/20">
                  <span className="text-[7px] font-bold text-yellow-400">En Çok Harcayanlar</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.05]">
                  <span className="text-[7px] text-white/30">Kazananlar</span>
                </div>
              </div>

              {/* Podium */}
              <div className="flex items-end justify-center gap-2 mb-4 h-[100px]">
                {/* 2nd */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center border-2 border-gray-400/40 shadow-lg">
                    <span className="text-[7px] font-bold text-black">SA</span>
                  </div>
                  <span className="text-[6px] text-white/50 mt-1">Selin</span>
                  <div className="w-12 h-12 mt-1 rounded-t-lg bg-gradient-to-b from-gray-400/20 to-gray-400/5 border border-gray-400/10 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-gray-400">2</span>
                  </div>
                </div>
                {/* 1st */}
                <div className="flex flex-col items-center">
                  <div className="text-[10px] mb-0.5">👑</div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center border-2 border-yellow-400/40 shadow-[0_0_16px_rgba(234,179,8,0.3)]">
                    <span className="text-[8px] font-bold text-black">KY</span>
                  </div>
                  <span className="text-[6px] text-yellow-400 mt-1 font-bold">Kaan</span>
                  <div className="w-14 h-16 mt-1 rounded-t-lg bg-gradient-to-b from-yellow-400/20 to-yellow-400/5 border border-yellow-400/15 flex items-center justify-center">
                    <span className="text-[12px] font-bold text-yellow-400">1</span>
                  </div>
                </div>
                {/* 3rd */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center border-2 border-orange-400/30 shadow-lg">
                    <span className="text-[7px] font-bold text-black">ED</span>
                  </div>
                  <span className="text-[6px] text-white/50 mt-1">Emre</span>
                  <div className="w-12 h-10 mt-1 rounded-t-lg bg-gradient-to-b from-orange-400/20 to-orange-400/5 border border-orange-400/10 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-orange-400">3</span>
                  </div>
                </div>
              </div>

              {/* List items */}
              <div className="space-y-2">
                {[
                  { rank: 4, name: 'Arda Kaya', coins: '8.200', color: 'from-cyan-400 to-cyan-600' },
                  { rank: 5, name: 'Zeynep Işık', coins: '6.750', color: 'from-pink-400 to-pink-600' },
                  { rank: 6, name: 'Ali Demir', coins: '5.100', color: 'from-green-400 to-green-600' },
                ].map(u => (
                  <div key={u.rank} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[8px] font-bold text-white/30 w-3">{u.rank}</span>
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${u.color} flex items-center justify-center`}>
                      <span className="text-[5px] font-bold text-black">{u.name.slice(0,2).toUpperCase()}</span>
                    </div>
                    <span className="text-[7px] text-white/70 flex-1">{u.name}</span>
                    <span className="text-[7px] text-cyan-400 font-bold">{u.coins} 💎</span>
                  </div>
                ))}
              </div>
            </div>
          </PhoneFrame>
        </ScreenshotCanvas>
      </div>
    </main>
  );
}
