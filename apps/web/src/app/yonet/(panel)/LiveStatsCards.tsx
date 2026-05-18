'use client';

import { useEffect, useState } from 'react';
import {
  Users, Home, MessageSquare, Coins, Flag, AlertTriangle,
  Smartphone, Wifi, WifiOff, UserPlus, Trash2, Clock,
} from 'lucide-react';

type Stats = {
  users: number;
  onlineNow: number;
  active5min: number;
  installedDevices: number;
  totalPushTokens: number;
  probablyDeleted: number;
  inactive14d: number;
  roomsLive: number;
  messages24h: number;
  reportsOpen: number;
  blocked: number;
  spVolume24h: number;
  newUsers24h: number;
  timestamp: number;
};

const POLL_INTERVAL_MS = 10_000;

export default function LiveStatsCards({ initial }: { initial: Stats }) {
  const [stats, setStats] = useState<Stats>(initial);
  const [updatedAgoSec, setUpdatedAgoSec] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch('/yonet/api/dashboard-stats', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setStats(data);
      } catch {
        // sessiz - bir sonraki polling denemesine bırak
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const interval = setInterval(fetchStats, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Saniye sayacı — son güncelleme bilgisi için
  useEffect(() => {
    const tick = setInterval(() => {
      setUpdatedAgoSec(Math.floor((Date.now() - stats.timestamp) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [stats.timestamp]);

  // "Pasif Yüklü" = uygulamayı yüklü tutuyor ama şu an aktif değil
  const passiveInstalled = Math.max(0, stats.installedDevices - stats.onlineNow);

  return (
    <div className="space-y-6">
      {/* Canlı durum çubuğu */}
      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          <span className="text-sm font-semibold text-green-300">Canlı</span>
          <span className="text-xs text-slate-500">· {POLL_INTERVAL_MS / 1000} saniyede bir yenilenir</span>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2">
          {loading && (
            <span className="inline-flex items-center gap-1 text-cyan-400">
              <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
              güncelleniyor…
            </span>
          )}
          <span>{updatedAgoSec === 0 ? 'şimdi' : `${updatedAgoSec} sn önce`}</span>
        </div>
      </div>

      {/* ANA 3 KART — kullanıcının özellikle istediği ölçümler */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BigCard
          icon={<Smartphone className="w-6 h-6" />}
          label="İndiren (Cihazda Yüklü)"
          subLabel="Uygulamayı yüklemiş kişi"
          value={fmt(stats.installedDevices)}
          accent="#22D3EE"
        />
        <BigCard
          icon={<Wifi className="w-6 h-6" />}
          label="Şu An Online"
          subLabel={`Son 5 dk aktif: ${fmt(stats.active5min)}`}
          value={fmt(stats.onlineNow)}
          accent="#22C55E"
          pulse={stats.onlineNow > 0}
        />
        <BigCard
          icon={<WifiOff className="w-6 h-6" />}
          label="Pasif Yüklü"
          subLabel="Yüklü ama şu an açık değil"
          value={fmt(passiveInstalled)}
          accent="#94A3B8"
        />
      </div>

      {/* KAYIP KULLANICI METRİKLERİ — silen/uzun süredir yok */}
      <div>
        <h3 className="text-xs font-bold tracking-widest text-slate-400 mb-3">KAYIP KULLANICI</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            icon={<Trash2 className="w-5 h-5" />}
            label="Muhtemelen Silmiş"
            value={fmt(stats.probablyDeleted)}
            accent="#F97316"
            subLabel="Kayıt olmuş ama push token kayıtlı değil"
          />
          <Card
            icon={<Clock className="w-5 h-5" />}
            label="14 Gündür Aktif Değil"
            value={fmt(stats.inactive14d)}
            accent="#EAB308"
            subLabel="Uygulamayı uzun süredir açmamış"
          />
        </div>
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
          ℹ️ Google Play "kullanıcı sildi" bildirimi göndermediği için bunlar <span className="text-slate-400">tahmindir</span>:
          push token'ı düşmüş kişi büyük ihtimalle uygulamayı silmiş.
        </p>
      </div>

      {/* DİĞER ÖLÇÜMLER */}
      <div>
        <h3 className="text-xs font-bold tracking-widest text-slate-400 mb-3">DİĞER METRİKLER</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card icon={<Users className="w-5 h-5" />} label="Toplam Kayıt" value={fmt(stats.users)} accent="#A78BFA" />
          <Card icon={<UserPlus className="w-5 h-5" />} label="Son 24sa Yeni" value={fmt(stats.newUsers24h)} accent="#EC4899" />
          <Card icon={<Home className="w-5 h-5" />} label="Canlı Oda" value={fmt(stats.roomsLive)} accent="#10B981" />
          <Card icon={<MessageSquare className="w-5 h-5" />} label="Son 24sa Mesaj" value={fmt(stats.messages24h)} accent="#3B82F6" />
          <Card icon={<Coins className="w-5 h-5" />} label="Son 24sa SP Hacmi" value={fmt(stats.spVolume24h)} accent="#FBBF24" />
          <Card icon={<Flag className="w-5 h-5" />} label="Bekleyen Şikayet" value={fmt(stats.reportsOpen)} accent="#EF4444" highlight={stats.reportsOpen > 0} />
          <Card icon={<AlertTriangle className="w-5 h-5" />} label="Toplam Engelleme" value={fmt(stats.blocked)} accent="#94A3B8" />
        </div>
      </div>
    </div>
  );
}

function BigCard({ icon, label, subLabel, value, accent, pulse }: {
  icon: React.ReactNode;
  label: string;
  subLabel?: string;
  value: string;
  accent: string;
  pulse?: boolean;
}) {
  return (
    <div
      className="relative bg-white/5 border rounded-2xl p-6 transition-colors overflow-hidden"
      style={{ borderColor: `${accent}40` }}
    >
      <div
        className="absolute top-0 left-6 right-6 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
      {pulse && (
        <div
          className="absolute -top-2 -right-2 w-20 h-20 rounded-full blur-2xl opacity-30 animate-pulse"
          style={{ backgroundColor: accent }}
        />
      )}
      <div className="flex items-center justify-between mb-4 relative">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          {icon}
        </div>
      </div>
      <div className="text-4xl font-bold text-slate-100 relative">{value}</div>
      <div className="text-sm font-semibold text-slate-300 mt-2 relative">{label}</div>
      {subLabel && <div className="text-xs text-slate-500 mt-1 relative">{subLabel}</div>}
    </div>
  );
}

function Card({ icon, label, value, accent, highlight, subLabel }: {
  icon: React.ReactNode; label: string; value: string; accent: string; highlight?: boolean; subLabel?: string;
}) {
  return (
    <div
      className={`relative bg-white/5 border rounded-2xl p-5 transition-colors ${
        highlight ? 'border-red-500/40 bg-red-500/5' : 'border-white/10'
      }`}
    >
      <div
        className="absolute top-0 left-6 right-6 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-100">{value}</div>
      <div className="text-xs text-slate-400 mt-1 tracking-wide">{label}</div>
      {subLabel && <div className="text-[10px] text-slate-500 mt-1 leading-tight">{subLabel}</div>}
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString('tr-TR');
}
