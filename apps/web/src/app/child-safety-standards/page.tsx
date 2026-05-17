/**
 * SopranoChat — Çocuk Güvenliği Standartları.
 * Google Play Console "Child Safety Standards" politikası gereği (Şubat 2026 zorunlu).
 * Privacy sayfasıyla birebir aynı dil: SopranoLogo + ambient glow + card pattern.
 * Son güncelleme: 18 Mayıs 2026.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, ShieldAlert, FileWarning, Users, Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Çocuk Güvenliği Standartları — SopranoChat',
  description:
    'SopranoChat çocuk güvenliği standartları: çocuk istismarı materyali (CSAM) yasağı, bildirim mekanizmaları, moderasyon süreçleri ve yetkililerle işbirliği.',
};

export default function ChildSafetyPage() {
  return (
    <div
      className="min-h-screen text-slate-100"
      style={{ background: '#0A0F1A', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
    >
      {/* Logo CSS — landing/privacy ile birebir aynı */}
      <style>{`
        @import url('https://fonts.cdnfonts.com/css/cooper-black');
        @keyframes logoGlow {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(120,200,200,0)) drop-shadow(0 2px 4px rgba(0,0,0,0.6)); }
          50% { filter: drop-shadow(0 0 8px rgba(120,200,200,0.3)) drop-shadow(0 0 20px rgba(120,200,200,0.1)) drop-shadow(0 2px 4px rgba(0,0,0,0.6)); }
        }
        .sc-logo {
          font-family: 'Cooper Black', 'Arial Rounded MT Bold', serif;
          font-weight: 900;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: flex-end;
        }
        .sc-logo-soprano {
          background: linear-gradient(180deg, #ffffff 0%, #dde4ee 35%, #b8c2d4 70%, #ccd4e4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6)) drop-shadow(1px 1px 0 rgba(0,0,0,0.4));
        }
        .sc-logo-chat {
          background: linear-gradient(180deg, #b8f0f0 0%, #5ec8c8 30%, #3a9e9e 65%, #4db0a8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6)) drop-shadow(1px 1px 0 rgba(20,80,70,0.5));
          animation: logoGlow 3s ease-in-out infinite;
        }
      `}</style>

      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 20% 0%, rgba(244, 63, 94, 0.10), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 100%, rgba(78, 176, 168, 0.10), transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* Header */}
      <header className="relative z-10 px-4 sm:px-8 py-5 max-w-3xl mx-auto">
        <Link href="/" aria-label="Anasayfa">
          <SopranoLogo />
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 px-4 sm:px-8 pt-6 pb-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 mb-6">
          <ShieldAlert className="w-3 h-3 text-rose-300" />
          <span className="text-[11px] font-semibold tracking-wider text-rose-300">
            ÇOCUK GÜVENLİĞİ STANDARTLARI
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold leading-[1.05] mb-3 text-slate-50">
          Çocukları korumak{' '}
          <span className="bg-gradient-to-r from-rose-300 via-amber-300 to-teal-300 bg-clip-text text-transparent">
            tartışılmaz
          </span>
          .
        </h1>
        <p className="text-xs text-slate-500 mb-6">Son güncelleme: 18 Mayıs 2026</p>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
          SopranoChat, çocukların cinsel istismarına yönelik her türlü içerik ve davranışı
          kesinlikle yasaklar. Bu sayfa, Google Play Çocuk Güvenliği Standartları Politikası
          gereği yayınlanmış olup, uygulamadaki önleme, tespit ve bildirim mekanizmalarımızı
          açıklar.
        </p>
      </section>

      {/* Bölümler */}
      <section className="relative z-10 px-4 sm:px-8 pb-12 max-w-3xl mx-auto space-y-4">
        <Card num={1} title="Sıfır Tolerans Politikası">
          <P>
            SopranoChat, <strong className="text-slate-100">Çocuk Cinsel İstismarı ve İstismarı
            (CSAE — Child Sexual Abuse and Exploitation)</strong> içeren her türlü içerik,
            görsel, ses, mesaj, davranış veya iletişimi <strong className="text-rose-300">
            sıfır tolerans</strong> ile yasaklar.
          </P>
          <SubTitle>Kesinlikle yasak</SubTitle>
          <UL>
            <LI label="Çocuk Cinsel İstismarı Materyali (CSAM)">
              Hiçbir biçimde paylaşılamaz, üretilemez, talep edilemez, depolanamaz veya
              başvurulamaz
            </LI>
            <LI label="Çocuk üzerinden uygunsuz iletişim kurma (grooming)">
              Reşit olmayan kullanıcılarla cinsel içerikli, manipülatif veya istismar amaçlı
              iletişim
            </LI>
            <LI label="Çocuğa yönelik tehdit, şiddet veya zorbalık">
              Mesaj, sesli mesaj, oda içi konuşma veya rumuz aracılığıyla
            </LI>
            <LI label="Çocukların cinselleştirilmesi">
              Avatar, görünen ad, biyografi, oda adı veya kozmetik öğelerle çocukları
              cinselleştirici içerikler
            </LI>
            <LI label="Çocuk istismarına teşvik">
              Yukarıdaki davranışları normalleştiren, savunan veya teşvik eden her türlü içerik
            </LI>
          </UL>
        </Card>

        <Card num={2} title="Yaş Doğrulama ve Erişim">
          <UL>
            <LI label="Asgari yaş: 13">
              SopranoChat 13 yaşın altındaki kullanıcılara açık değildir. Kayıt sırasında doğum
              tarihi alınır ve 13 yaşından küçük hesaplar oluşturulamaz
            </LI>
            <LI label="Yaşa duyarlı içerik (+18) erişimi">
              +18 olarak işaretlenmiş odalara yalnızca 18+ kullanıcılar girebilir; oda sahibi
              odanın yaş kısıtını ayarlayabilir
            </LI>
            <LI label="Sahte yaş beyanı">
              Yaşını yanlış beyan eden hesaplar tespit edildiğinde derhal askıya alınır.
              Şüpheli hesaplar için ek doğrulama isteyebiliriz
            </LI>
          </UL>
        </Card>

        <Card num={3} title="Önleme Mekanizmaları">
          <SubTitle>Otomatik filtreleme</SubTitle>
          <UL>
            <LI label="Yasaklı kelime filtresi">
              Mesajlarda, oda adlarında, görünen adlarda ve biyografilerde çocuk istismarına
              dair (CSAM, grooming, cinselleştirme) yasaklı kelime listesi otomatik taranır
            </LI>
            <LI label="Görsel moderasyon">
              Yüklenen profil fotoğrafları ve mağaza içeriği yönetici onayından geçer; uygunsuz
              içerikler yayımlanmaz
            </LI>
            <LI label="Avatar/rumuz kontrolü">
              Çocukları cinselleştirici avatar, görünen ad veya rumuz reddedilir
            </LI>
          </UL>

          <SubTitle>Manuel moderasyon</SubTitle>
          <UL>
            <LI label="Yönetici paneli">
              Yöneticiler kullanıcı, oda ve mesaj raporlarını gerçek zamanlı izler ve aksiyon
              alır
            </LI>
            <LI label="Engelleme listesi">
              Kullanıcılar dilediği kişiyi engelleyebilir; engelli kullanıcı tarafından mesaj,
              hediye veya etkileşim alamaz
            </LI>
            <LI label="Oda sahibi yetkileri">
              Oda sahipleri ve moderatörler odadaki kullanıcıyı susturabilir, kovabilir veya
              raporlayabilir
            </LI>
          </UL>
        </Card>

        <Card num={4} title="Bildirim Mekanizmaları">
          <P>
            Çocukların güvenliğiyle ilgili her şüpheyi bize bildirmen için uygulama içinde
            birden fazla yol vardır:
          </P>
          <UL>
            <LI label="Kullanıcı raporla">
              Herhangi bir profil sayfasında üç nokta menüsünden "Raporla" seçeneğiyle, kategori
              ve açıklama girerek
            </LI>
            <LI label="Mesaj raporla">
              Direkt mesaj veya oda sohbet mesajı üzerine uzun basarak çıkan menüden "Raporla"
            </LI>
            <LI label="Oda raporla">
              Oda içi menüde "Bu odayı bildir" seçeneğiyle; oda adı, sahibi ve oda içi davranış
              raporlanabilir
            </LI>
            <LI label="E-posta">
              Acil durumlar için doğrudan <ExtLink href="mailto:sopranochat@gmail.com">
              sopranochat@gmail.com</ExtLink> adresine yaz
            </LI>
          </UL>
          <P>
            Çocuk güvenliğiyle ilgili raporlar <strong className="text-rose-300">en yüksek
            öncelikle</strong> ele alınır ve 24 saat içinde incelenir.
          </P>
        </Card>

        <Card num={5} title="İhlal Halinde Aksiyonlarımız">
          <UL>
            <LI label="Hesap askıya alma / kalıcı yasak">
              CSAM, grooming veya çocuğa yönelik istismar tespit edildiğinde hesap derhal kalıcı
              olarak yasaklanır; aynı kişinin yeni hesap açması engellenir (cihaz/IP kara
              listesi)
            </LI>
            <LI label="İçeriğin kaldırılması">
              İlgili mesaj, oda, görsel veya ses kaydı sistemden silinir; kanıt amaçlı yedeği
              güvenli ortamda saklanır
            </LI>
            <LI label="Yetkililere bildirim">
              CSAM tespit edildiğinde Türkiye'de <strong className="text-slate-100">Bilgi
              Teknolojileri ve İletişim Kurumu (BTK)</strong>, kolluk kuvvetleri ve gerektiğinde
              uluslararası <strong className="text-slate-100">National Center for Missing &
              Exploited Children (NCMEC)</strong> kuruluşuna bildirim yapılır
            </LI>
            <LI label="Hukuki süreç desteği">
              Yetkili makamlardan gelen yasal taleplere (delil, kullanıcı bilgisi) hukuki
              çerçevede tam destek sağlanır
            </LI>
          </UL>
        </Card>

        <Card num={6} title="Eğitim ve Şeffaflık">
          <UL>
            <LI label="Moderatör eğitimi">
              Yöneticilerimiz çocuk istismarı işaretlerini tanıma, raporları doğru kategorize
              etme ve hızlı aksiyon alma konusunda eğitilir
            </LI>
            <LI label="Topluluk kuralları">
              Kayıt sırasında ve uygulama içi yardım sayfasında çocuk güvenliği kuralları
              kullanıcılarla net şekilde paylaşılır
            </LI>
            <LI label="Politika güncellemeleri">
              Bu sayfa Google Play standartları, KVKK ve uluslararası iyi uygulamalar paralelinde
              düzenli olarak güncellenir
            </LI>
          </UL>
        </Card>

        <Card num={7} title="İletişim">
          <P>
            Çocuk güvenliğiyle ilgili her türlü endişeni, soruyu veya bildirimini bize doğrudan
            iletebilirsin:
          </P>
          <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/5 border border-teal-500/30">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-teal-300 shrink-0" />
              <div>
                <div className="text-xs text-slate-400 mb-1">Çocuk güvenliği iletişim noktası</div>
                <a
                  href="mailto:sopranochat@gmail.com"
                  className="text-base font-semibold text-teal-200 hover:text-teal-100"
                >
                  sopranochat@gmail.com
                </a>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              E-postalara hafta içi 24 saat, hafta sonu 48 saat içinde dönüş yapılır. Acil ve
              hayati tehlike içeren durumlarda doğrudan kolluk kuvvetlerine (155 — Polis İmdat)
              başvur.
            </p>
          </div>
        </Card>

        <div className="text-center pt-4 pb-8">
          <Link
            href="/privacy"
            className="text-sm text-cyan-300 hover:text-cyan-200 underline decoration-cyan-300/40 underline-offset-2"
          >
            Gizlilik Politikası →
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ─────────────── Helper'lar (privacy/page.tsx ile birebir aynı pattern) ─────────────── */
function Card({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <article className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur">
      <h2 className="flex items-center gap-3 mb-4 text-lg font-bold text-slate-100">
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-extrabold"
          style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.30)',
            color: '#FDA4AF',
          }}
        >
          {num}
        </span>
        {title}
      </h2>
      {children}
    </article>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-slate-300 mt-4 mb-2 tracking-wide">{children}</h3>
  );
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-2">{children}</ul>;
}

function LI({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-sm text-slate-400 leading-relaxed">
      <span className="mt-2 w-1 h-1 rounded-full bg-rose-400 shrink-0" aria-hidden="true" />
      <span>
        {label && <strong className="text-slate-200 font-semibold">{label}</strong>}
        {label ? ' — ' : ''}
        {children}
      </span>
    </li>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-400 leading-relaxed mb-3">{children}</p>;
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-cyan-300 hover:text-cyan-200 underline decoration-cyan-300/40 underline-offset-2"
    >
      {children}
    </a>
  );
}

/* ─────────────── Logo (landing/privacy ile birebir aynı) ─────────────── */
function SopranoLogo() {
  return (
    <div
      className="sc-logo"
      style={{
        lineHeight: 1,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'baseline',
      }}
    >
      <span className="sc-logo-soprano" style={{ fontSize: 32, lineHeight: 1 }}>
        Soprano
      </span>
      <span className="sc-logo-chat" style={{ fontSize: 32, lineHeight: 1, marginLeft: 1 }}>
        Chat
      </span>
    </div>
  );
}
