"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// ═══════════════════════════════════════════════════════
// SopranoChat.com — Premium Landing Page
// Gece mavisi, buzlu cam, turkuaz neon parlamalar
// ═══════════════════════════════════════════════════════

/* ─── Fade-up on scroll ─── */
function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, className: visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8" };
}

/* ─── Floating Orb (Ambient Light) ─── */
function Orb({ className, style }: { className: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{ filter: 'blur(120px)', ...style }}
      aria-hidden
    />
  );
}

/* ─── Shimmer CTA Button ─── */
function ShimmerButton({
  children,
  href,
  icon,
}: {
  children: React.ReactNode;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative inline-flex items-center gap-3 px-7 py-4 rounded-2xl
                 bg-[#0c1428]/80 border border-white/[0.06] backdrop-blur-xl
                 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-2px_4px_rgba(0,0,0,0.3)]
                 hover:border-cyan-400/20 hover:shadow-[0_0_30px_rgba(92,225,230,0.08)]
                 transition-all duration-500 overflow-hidden"
    >
      {/* Shimmer sweep */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
      <span className="text-white/60 group-hover:text-white/90 transition-colors z-10">
        {icon}
      </span>
      <span className="text-[15px] font-semibold text-white/80 group-hover:text-white transition-colors z-10">
        {children}
      </span>
    </a>
  );
}

/* ─── Bento Feature Card ─── */
function FeatureCard({
  icon,
  title,
  desc,
  accent,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: string;
  delay: string;
}) {
  const fade = useFadeUp();

  return (
    <div
      ref={fade.ref}
      className={`relative rounded-3xl border border-white/[0.05] p-8 md:p-10
                  bg-[#0a0f1e]/60 backdrop-blur-xl overflow-hidden
                  transition-all duration-700 ease-out ${fade.className}`}
      style={{ transitionDelay: delay }}
    >
      {/* Corner glow */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-[80px] opacity-20 pointer-events-none"
        style={{ background: accent }}
      />
      {/* Icon */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5
                    border border-white/[0.06]"
        style={{ background: `${accent}12` }}
      >
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-[15px] text-white/50 leading-relaxed">{desc}</p>
    </div>
  );
}

// ── SVG Icons (inline, no deps) ──

const AppleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
  </svg>
);

const CrownIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CFB53B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 17l3-11 5 5 2-8 2 8 5-5 3 11H2z"/><path d="M2 17h20v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2z"/>
  </svg>
);

const DiamondIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5CE1E6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 7-10 11L2 10l4-7z"/><path d="M2 10h20"/><path d="M12 21L6 10l6-7 6 7-6 11z"/>
  </svg>
);

const VIPIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C0C0C0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="3"/><path d="M7 15V9l2.5 3L12 9v6"/><path d="M16 9v6"/><path d="M19 9v6"/>
  </svg>
);

// ═══════════════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════════════

export default function LandingPage() {
  const heroFade = useFadeUp();

  return (
    <main className="relative min-h-screen text-white overflow-hidden" style={{ backgroundColor: '#040810', fontFamily: 'var(--font-sans)' }}>
      {/* ═══ AMBIENT ORBS ═══ */}
      <Orb className="w-[600px] h-[600px] top-[-200px] left-[-100px]" style={{ backgroundColor: 'rgba(6,182,212,0.07)', animation: 'pulse-slow 8s ease-in-out infinite' }} />
      <Orb className="w-[500px] h-[500px] top-[100px] right-[-150px]" style={{ backgroundColor: 'rgba(34,211,238,0.05)', animation: 'sc-float 6s ease-in-out infinite' }} />
      <Orb className="w-[400px] h-[400px] bottom-[200px] left-[30%]" style={{ backgroundColor: 'rgba(168,85,247,0.04)', animation: 'pulse-slow 8s ease-in-out infinite' }} />

      {/* ═══ NAV ═══ */}
      <nav className="relative z-20 flex flex-col items-center px-6 md:px-16 pt-6 pb-2">
        <Image
          src="/logo.png"
          alt="SopranoChat"
          width={500}
          height={125}
          className="drop-shadow-[0_0_24px_rgba(92,225,230,0.2)]"
          priority
        />
        <div className="hidden md:flex items-center gap-8 mt-4">
          <a href="#features" className="text-sm text-white/40 hover:text-white/80 transition-colors">Özellikler</a>
          <a href="#download" className="text-sm text-white/40 hover:text-white/80 transition-colors">İndir</a>
          <a href="https://sopranochat.com" className="text-sm px-5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/70 hover:text-white hover:border-cyan-400/20 transition-all">
            Giriş Yap
          </a>
        </div>
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative z-10 flex flex-col lg:flex-row items-center justify-between px-6 md:px-16 pt-16 md:pt-24 pb-24 gap-16 max-w-7xl mx-auto">
        {/* Text */}
        <div
          ref={heroFade.ref}
          className={`flex-1 max-w-2xl transition-all duration-1000 ease-out ${heroFade.className}`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-400/[0.08] border border-cyan-400/[0.12] mb-8">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(92,225,230,0.6)]" />
            <span className="text-xs font-medium text-cyan-300/80 tracking-wide">Şimdi Beta&apos;da</span>
          </div>

          <h1 className="text-4xl md:text-[3.4rem] font-extrabold leading-[1.1] tracking-tight mb-6">
            <span className="bg-gradient-to-b from-white via-white/90 to-white/50 bg-clip-text text-transparent">
              Senin Sesin,{" "}
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-cyan-300 bg-clip-text text-transparent">
              Senin Kuralların.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/40 leading-relaxed max-w-lg mb-10 font-light">
            Seçkinlerin dijital kulübüne hoş geldin. SopranoChat ile localar kur,
            yetkilerini yönet ve kendi ekonomini yarat.
          </p>

          {/* CTA Buttons */}
          <div id="download" className="flex flex-wrap gap-4">
            <ShimmerButton href="#" icon={<AppleIcon />}>
              App Store&apos;dan İndir
            </ShimmerButton>
            <ShimmerButton href="#" icon={<PlayIcon />}>
              Google Play&apos;den Edin
            </ShimmerButton>
          </div>
        </div>

        {/* Phone Mockup */}
        <div className="relative flex-shrink-0">
          {/* Glow behind phone */}
          <div className="absolute inset-0 -m-12 rounded-full bg-cyan-500/[0.06] blur-[80px] animate-pulse-slow" />

          <div
            className="relative w-[280px] md:w-[320px] rounded-[3rem] border-2 border-white/[0.08]
                        p-3
                        transform rotate-[3deg]
                        hover:rotate-0 transition-transform duration-700 ease-out"
            style={{
              background: 'linear-gradient(to bottom, #0c1428, #060a16)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
              animation: 'sc-float 6s ease-in-out infinite',
            }}
          >
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#040810] rounded-b-2xl z-10" />

            {/* Screen Content (simulated VIP Loca) */}
            <div className="relative rounded-[2.4rem] overflow-hidden bg-[#080e1e] aspect-[9/19.5]">
              {/* Inner gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/20 via-transparent to-purple-900/10" />

              {/* Room Header */}
              <div className="relative pt-10 px-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center border-2 border-yellow-400/30">
                    <span className="text-[10px] font-bold text-black">KY</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-white/90">Midnight Lounge</div>
                    <div className="text-[9px] text-white/40">Kaan Yıldız • VIP</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[9px] text-green-400/80">Canlı</span>
                  </div>
                </div>

                {/* Speaker Grid */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {[
                    { name: "Kaan", color: "from-yellow-400 to-yellow-600", ring: "border-yellow-400/40" },
                    { name: "Selin", color: "from-cyan-400 to-cyan-600", ring: "border-cyan-400/40" },
                    { name: "Emre", color: "from-purple-400 to-purple-600", ring: "border-purple-400/40" },
                    { name: "Arda", color: "from-cyan-400 to-cyan-600", ring: "border-cyan-400/20" },
                    { name: "Zeynep", color: "from-pink-400 to-pink-600", ring: "border-pink-400/20" },
                    { name: "Ali", color: "from-green-400 to-green-600", ring: "border-green-400/20" },
                  ].map((u) => (
                    <div key={u.name} className="flex flex-col items-center gap-1.5">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${u.color} flex items-center justify-center border-2 ${u.ring} shadow-lg`}>
                        <span className="text-[9px] font-bold text-black">
                          {u.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[8px] text-white/50">{u.name}</span>
                    </div>
                  ))}
                </div>

                {/* Bottom bar */}
                <div className="mt-8 flex items-center justify-center gap-5">
                  <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <div className="w-3.5 h-3.5 rounded-sm bg-cyan-400/60" />
                  </div>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                    <svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-white/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BENTO FEATURES ═══ */}
      <section id="features" className="relative z-10 px-6 md:px-16 pb-32 max-w-7xl mx-auto">
        {/* Section label */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-cyan-400/60 tracking-[0.2em] uppercase">Ayrıcalıklar</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-3 bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
            Neden SopranoChat?
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <FeatureCard
            icon={<CrownIcon />}
            title="Otorite Sende"
            desc="Kendi locanı aç, vizeleri belirle, yetki sat. Hükümdarlığını ilan et."
            accent="#CFB53B"
            delay="0ms"
          />
          <FeatureCard
            icon={<DiamondIcon />}
            title="Lüks Ekonomi"
            desc="Basit emojileri unut. 3D kristaller ve elmaslarla etkileşime gir, kazancını büyüt."
            accent="#5CE1E6"
            delay="120ms"
          />
          <FeatureCard
            icon={<VIPIcon />}
            title="Soprano VIP"
            desc="İsim rengini değiştir, odalara gösterişli gir, sıralamada zirveye otur."
            accent="#C0C0C0"
            delay="240ms"
          />
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 md:px-16 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo */}
          <Image
              src="/logo.png"
              alt="SopranoChat"
              width={36}
              height={36}
              className="rounded-lg"
            />

          {/* Links */}
          <div className="flex items-center gap-6">
            <a href="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors">Gizlilik Politikası</a>
            <a href="/terms" className="text-xs text-white/30 hover:text-white/60 transition-colors">Kullanıcı Sözleşmesi</a>
            <a href="/support" className="text-xs text-white/30 hover:text-white/60 transition-colors">Destek</a>
          </div>

          {/* Social */}
          <div className="flex items-center gap-4">
            {[
              { href: "#", d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
              { href: "#", d: "M12.004 2c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10zm5.07 6.09c-.295.015-.59.037-.885.063 0 0-1.127 4.495-3.18 7.501l-1.83-5.907h-2.19l3.091 8.46c-1.102 1.49-2.695 2.736-4.735 2.736-.295 0-.58-.022-.86-.064a7.957 7.957 0 01-2.48-1.317 9.953 9.953 0 001.68.143c4.89 0 8.855-3.956 8.855-8.854 0-.262-.015-.52-.04-.776.614-.447 1.145-.999 1.574-1.636z" },
            ].map((s, i) => (
              <a
                key={i}
                href={s.href}
                className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center hover:border-white/10 transition-colors"
              >
                <svg width="14" height="14" fill="currentColor" className="text-white/30" viewBox="0 0 24 24">
                  <path d={s.d} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <div className="text-center pb-8">
          <p className="text-[11px] text-white/20">© 2024 SopranoChat. Tüm hakları saklıdır.</p>
        </div>
      </footer>

      {/* Global animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sc-float {
          0%, 100% { transform: translateY(0px) rotate(3deg); }
          50% { transform: translateY(-16px) rotate(1deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}} />
    </main>
  );
}
