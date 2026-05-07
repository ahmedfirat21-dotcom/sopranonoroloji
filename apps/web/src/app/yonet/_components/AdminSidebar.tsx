"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Flag, Users, Store, Home, MessageSquare,
  Coins, Bell, Crown, Settings as SettingsIcon, TrendingUp, Banknote, ScrollText,
  ShieldAlert, UserPlus,
} from 'lucide-react';
import SopranoLogoMini, { SopranoLogoStyleTag } from './SopranoLogoMini';

const NAV = [
  { href: '/yonet', label: 'Panel', icon: LayoutDashboard, exact: true },
  { href: '/yonet/ekonomi', label: 'Ekonomi', icon: TrendingUp },
  { href: '/yonet/sikayetler', label: 'Şikayetler', icon: Flag },
  { href: '/yonet/kullanicilar', label: 'Kullanıcılar', icon: Users },
  { href: '/yonet/magaza', label: 'Mağaza', icon: Store },
  { href: '/yonet/uyelik', label: 'Üyelik Planları', icon: Crown },
  { href: '/yonet/odalar', label: 'Odalar', icon: Home },
  { href: '/yonet/mesajlar', label: 'Mesaj İncelemesi', icon: MessageSquare },
  { href: '/yonet/sp', label: 'SP İşlemleri', icon: Coins },
  { href: '/yonet/cashout', label: 'Para Çekme', icon: Banknote },
  { href: '/yonet/push', label: 'Push Bildirim', icon: Bell },
  { href: '/yonet/davetler', label: 'Davetler', icon: UserPlus },
  { href: '/yonet/guvenlik', label: 'Güvenlik', icon: ShieldAlert },
  { href: '/yonet/audit', label: 'İşlem Kayıtları', icon: ScrollText },
  { href: '/yonet/ayarlar', label: 'Ayarlar', icon: SettingsIcon },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-white/[0.08] flex flex-col">
      <SopranoLogoStyleTag />

      {/* Header — SopranoLogo + amber YÖNETİM tagline */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Link href="/yonet" className="block">
          <SopranoLogoMini size="md" tagline="YÖNETİM" taglineAmber />
        </Link>
      </div>

      {/* Nav — turkuaz aktif vurgu (ana sayfa paleti) */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(item => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                active
                  ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/10 text-cyan-200 border border-teal-500/30 shadow-[0_0_12px_-4px_rgba(20,184,166,0.4)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-teal-300' : ''}`} />
              <span className="font-medium">{item.label}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer — sade marka altı */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <div className="text-[10px] text-slate-500 tracking-wider">
          Maison Soprano · v1.0
        </div>
        <Link
          href="/"
          className="text-[10px] text-slate-600 hover:text-cyan-300 tracking-wider mt-1 inline-block transition-colors"
        >
          ← Ana siteye dön
        </Link>
      </div>
    </aside>
  );
}
