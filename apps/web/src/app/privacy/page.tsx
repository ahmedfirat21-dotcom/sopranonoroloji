/**
 * SopranoChat — Gizlilik Politikası.
 * Landing-new sayfasıyla birebir aynı dil: SopranoLogo + ambient glow + card pattern.
 * Son güncelleme: 7 Mayıs 2026 (mağaza, voice bio, çift oturum, hediye, foreground service eklendi).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası — SopranoChat',
  description:
    'SopranoChat gizlilik politikası: hangi verilerin toplandığını, nasıl işlendiğini ve nasıl korunduğunu sade bir dille açıklar.',
};

export default function PrivacyPage() {
  return (
    <div
      className="min-h-screen text-slate-100"
      style={{ background: '#0A0F1A', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
    >
      {/* Logo CSS — landing ile birebir aynı */}
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
        .sc-logo-tagline {
          font-family: 'Cooper Black', 'Arial Rounded MT Bold', sans-serif;
          letter-spacing: 1.5px;
          background: linear-gradient(180deg, #ffffff 0%, #dde4ee 35%, #b8c2d4 70%, #ccd4e4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
        }
      `}</style>

      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 20% 0%, rgba(78, 176, 168, 0.15), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 100%, rgba(123, 159, 239, 0.10), transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* Header — anasayfaya link */}
      <header className="relative z-10 px-4 sm:px-8 py-5 max-w-3xl mx-auto">
        <Link href="/" aria-label="Anasayfa">
          <SopranoLogo size="lg" />
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 px-4 sm:px-8 pt-6 pb-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-6">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
          <span className="text-[11px] font-semibold tracking-wider text-cyan-300">
            GİZLİLİK POLİTİKASI
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold leading-[1.05] mb-3 text-slate-50">
          Verilerin senin,{' '}
          <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-fuchsia-300 bg-clip-text text-transparent">
            sesin senin
          </span>
          .
        </h1>
        <p className="text-xs text-slate-500 mb-6">Son güncelleme: 7 Mayıs 2026</p>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
          SopranoChat olarak gizliliğine saygı duyuyoruz. Bu politika, uygulamayı kullanırken
          hangi verilerin toplandığını, nasıl işlendiğini ve nasıl korunduğunu sade bir dille
          açıklar.
        </p>
      </section>

      {/* Bölümler */}
      <section className="relative z-10 px-4 sm:px-8 pb-12 max-w-3xl mx-auto space-y-4">
        <Card num={1} title="Toplanan Veriler">
          <SubTitle>Hesap bilgileri</SubTitle>
          <UL>
            <LI label="E-posta adresi">kimlik doğrulama, hesap kurtarma ve şifre sıfırlama linki için</LI>
            <LI label="Görünen ad">diğer kullanıcılara gösterilmek üzere</LI>
            <LI label="Kullanıcı adı">profilini tanımlamak için</LI>
            <LI label="Profil fotoğrafı">yalnızca kendin yüklediğinde</LI>
            <LI label="Doğum tarihi">yaş doğrulaması (13+ zorunluluğu) için</LI>
            <LI label="Cinsiyet">profil bilgisi olarak (isteğe bağlı)</LI>
            <LI label="Profil ek bilgileri">
              diller, ilgi alanları, kişisel not, sosyal medya bağlantıları (tamamı isteğe bağlı)
            </LI>
            <LI label="Sesli profil tanıtımı (Voice Bio)">
              profiline ses kaydı eklediğinde sunucumuzda saklanır ve diğer kullanıcılara gösterilir;
              istediğin zaman silebilirsin
            </LI>
          </UL>

          <SubTitle>Kullanım verileri</SubTitle>
          <UL>
            <LI label="Mesajlar">
              kullanıcılar arası metin, fotoğraf ve sesli mesajlar sunucularımızda saklanır
            </LI>
            <LI label="Oda katılım geçmişi">
              hangi sohbet odalarına katıldığın ve oda içi rolün (sahne, dinleyici, moderatör)
            </LI>
            <LI label="Bildirim tercihleri">
              push bildirim için ayrı bir tabloda saklanan cihaz token&apos;ları (yalnızca bildirim göndermek için)
            </LI>
            <LI label="Cihaz bilgileri">işletim sistemi, uygulama sürümü (hata ayıklama için)</LI>
            <LI label="Cihaz tanımlayıcısı">
              aynı hesapla iki cihazdan aynı anda giriş yapılmasını engellemek (çift oturum koruması)
              için cihazına özel rastgele bir kimlik (UUID) saklanır. Reklam takibi için kullanılmaz,
              üçüncü taraflarla paylaşılmaz.
            </LI>
            <LI label="Etkileşim verileri">
              takip ettiklerin, takipçilerin, arkadaş listesi, engellediğin kullanıcılar
            </LI>
          </UL>

          <SubTitle>Uygulama içi ekonomi ve satın alma</SubTitle>
          <UL>
            <LI label="SP bakiyesi">
              uygulama içi sanal puan (Soprano Puanı) bakiyesi ve işlem geçmişi
            </LI>
            <LI label="SP transferi/hediye geçmişi">
              diğer kullanıcılara gönderdiğin/aldığın hediye, bağış ve ödüller; &quot;top destekçi&quot; gibi
              liderlik tabloları için kullanılır
            </LI>
            <LI label="Mağaza envanteri (Maison Soprano)">
              satın aldığın kozmetik ürünler (avatar çerçevesi, mesaj parıltısı, sahne ışığı vb.)
              ve aktif kullandıkların diğer kullanıcılara gösterilir
            </LI>
            <LI label="Abonelik durumu">
              aktif aboneliğin (Plus / Pro), başlangıç ve yenilenme tarihleri
            </LI>
            <LI label="Satın alma geçmişi">
              uygulama içi satın alma kayıtları (yalnızca kayıt amaçlı, kart/finansal bilgi içermez)
            </LI>
          </UL>

          <SubTitle>Sesli ve görüntülü iletişim</SubTitle>
          <UL>
            <LI label="Mikrofon ve kamera">
              yalnızca sesli/görüntülü oda oturumlarında, izin verdiğinde aktif olur
            </LI>
            <LI label="Arka plan ses bağlantısı (Android)">
              bir sesli odadayken telefonu kilitlersen veya başka bir uygulamaya geçersen bağlantın
              kopmasın diye Android&apos;in &quot;ön plan servisi&quot; özelliği kullanılır. Bu sırada bildirim
              çubuğunda bir ikon görünür. Mikrofonun yalnızca odadayken ve sen konuştuğunda etkindir;
              oda dışında dinleme yapılmaz.
            </LI>
            <LI label="Oda kayıtları (opsiyonel)">
              oda sahibi açıkça başlatırsa oda içi ses kaydedilebilir; tüm katılımcılar bilgilendirilir,
              kayıtlar yasal saklama süresi sonunda otomatik silinir
            </LI>
          </UL>

          <SubTitle>Toplamadığımız veriler</SubTitle>
          <ul className="space-y-2">
            <NoCollect>
              <strong className="text-slate-200 font-semibold">Konum bilgisi</strong> — GPS veya IP
              tabanlı kesin konum verisi toplamıyoruz
            </NoCollect>
            <NoCollect>
              <strong className="text-slate-200 font-semibold">Kişi listesi</strong> — telefon
              rehberine erişmiyoruz
            </NoCollect>
            <NoCollect>
              <strong className="text-slate-200 font-semibold">Arama geçmişi</strong> — telefon
              aramalarına erişmiyoruz
            </NoCollect>
            <NoCollect>
              <strong className="text-slate-200 font-semibold">Reklam tanımlayıcısı</strong> — Google
              Advertising ID veya benzer reklam takip kimlikleri toplamıyoruz
            </NoCollect>
            <NoCollect>
              <strong className="text-slate-200 font-semibold">Finansal bilgiler</strong> — kredi
              kartı bilgileri yalnızca ödeme sağlayıcıda (RevenueCat / Google Play) tutulur, bizim
              sunucularımıza gelmez
            </NoCollect>
          </ul>
        </Card>

        <Card num={2} title="Verilerin İşlenme Amaçları">
          <UL>
            <LI>Kullanıcı kimlik doğrulaması ve hesap yönetimi</LI>
            <LI>Mesaj iletimi ve sesli/görüntülü sohbet odası hizmetleri</LI>
            <LI>Push bildirim gönderimi (mesaj, oda daveti, hediye bildirimleri)</LI>
            <LI>Uygulama içi sanal ekonomi (SP) ve satın alma kayıtları</LI>
            <LI>Çift oturum koruması (aynı hesabın iki cihazda aktif olmaması)</LI>
            <LI>Uygulama güvenliği, kötüye kullanım önleme ve moderasyon</LI>
            <LI>Hizmet kalitesinin iyileştirilmesi ve hata ayıklama</LI>
          </UL>
        </Card>

        <Card num={3} title="Üçüncü Taraf Hizmetler">
          <p className="text-sm text-slate-400 leading-relaxed mb-3">
            SopranoChat aşağıdaki üçüncü taraf hizmetleri kullanmaktadır:
          </p>
          <UL>
            <LI label="Firebase Authentication (Google)">
              kimlik doğrulama.{' '}
              <ExtLink href="https://firebase.google.com/support/privacy">
                Firebase Gizlilik Politikası
              </ExtLink>
            </LI>
            <LI label="Firebase Cloud Messaging (Google)">
              push bildirim gönderimi.{' '}
              <ExtLink href="https://firebase.google.com/support/privacy">
                Firebase Gizlilik Politikası
              </ExtLink>
            </LI>
            <LI label="Supabase">
              veritabanı, dosya depolama ve gerçek zamanlı veri.{' '}
              <ExtLink href="https://supabase.com/privacy">Supabase Gizlilik Politikası</ExtLink>
            </LI>
            <LI label="LiveKit (Hetzner Almanya altyapısı)">
              sesli ve görüntülü arama altyapısı.{' '}
              <ExtLink href="https://livekit.io/privacy">LiveKit Gizlilik Politikası</ExtLink>
            </LI>
            <LI label="RevenueCat">
              uygulama içi satın alma ve abonelik yönetimi.{' '}
              <ExtLink href="https://www.revenuecat.com/privacy">
                RevenueCat Gizlilik Politikası
              </ExtLink>
            </LI>
            <LI label="Google Play Hizmetleri">
              Google ile giriş ve ödeme.{' '}
              <ExtLink href="https://policies.google.com/privacy">
                Google Gizlilik Politikası
              </ExtLink>
            </LI>
          </UL>
        </Card>

        <Card num={4} title="Verilerin Saklanması ve Güvenliği">
          <UL>
            <LI>Verilerin Supabase (AWS altyapısı) üzerinde şifreli olarak saklanır</LI>
            <LI>
              Sesli/görüntülü iletişim sunucuları LiveKit (Hetzner Almanya) üzerinde çalışır; ses ve
              görüntü trafiği WebRTC üzerinden uçtan uca şifrelidir
            </LI>
            <LI>Tüm veri iletişimi HTTPS / TLS üzerinden gerçekleşir</LI>
            <LI>
              Şifreler Firebase Authentication tarafından hash&apos;lenir, düz metin olarak saklanmaz
            </LI>
            <LI>
              Veritabanı erişimi satır seviyesinde güvenlik kuralları (RLS) ile korunur — kendi
              verilerine yalnızca sen erişebilirsin
            </LI>
          </UL>
        </Card>

        <Card num={5} title="Kullanıcı Hakların (KVKK)">
          <p className="text-sm text-slate-400 leading-relaxed mb-3">
            6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aşağıdaki haklara sahipsin:
          </p>
          <UL>
            <LI>Kişisel verilerinin işlenip işlenmediğini öğrenme</LI>
            <LI>İşlenmiş ise buna ilişkin bilgi talep etme</LI>
            <LI>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</LI>
            <LI>Yurt içinde veya yurt dışında kişisel verilerinin aktarıldığı üçüncü kişileri bilme</LI>
            <LI>Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde düzeltilmesini isteme</LI>
            <LI>Kişisel verilerinin silinmesini veya yok edilmesini isteme</LI>
            <LI>Verilerinin bir kopyasını indirme (Ayarlar → Veri İndir)</LI>
          </UL>
        </Card>

        <Card num={6} title="Hesap Silme">
          <p className="text-sm text-slate-400 leading-relaxed mb-3">
            Hesabını istediğin zaman silebilirsin:
          </p>
          <UL>
            <LI label="Uygulama içinden">Ayarlar → Hesap → Hesabımı Sil</LI>
            <LI>
              Hesap silindiğinde tüm profil bilgileri, mesajlar, ses kayıtları, mağaza envanteri ve
              ilişkili veriler kalıcı olarak kaldırılır
            </LI>
            <LI>SP bakiyen ve aktif aboneliğin iade edilmez</LI>
            <LI>Silme işlemi geri alınamaz</LI>
          </UL>
        </Card>

        <Card num={7} title="Çocukların Gizliliği">
          <p className="text-sm text-slate-400 leading-relaxed">
            SopranoChat 13 yaşından küçük çocuklara yönelik değildir. Kayıt sırasında doğum tarihi
            doğrulaması yapılmaktadır. 13 yaş altı kullanıcıların hesapları tespit edildiğinde
            kapatılır.
          </p>
        </Card>

        <Card num={8} title="Çerezler ve Analitik">
          <p className="text-sm text-slate-400 leading-relaxed">
            Mobil uygulama olarak tarayıcı çerezleri kullanmıyoruz. Firebase ve Supabase SDK&apos;ları
            cihaz üzerinde oturum bilgisi saklamak için güvenli depolama (AsyncStorage) kullanır.
            Reklam veya davranışsal hedefleme amaçlı analitik kullanmıyoruz.
          </p>
        </Card>

        <Card num={9} title="Değişiklikler">
          <p className="text-sm text-slate-400 leading-relaxed">
            Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişikliklerde uygulama
            içinde bildirim yapılır.
          </p>
        </Card>

        <Card num={10} title="İletişim">
          <p className="text-sm text-slate-400 leading-relaxed mb-3">
            Gizlilik ile ilgili sorularını bize iletebilirsin:
          </p>
          <a
            href="mailto:sopranochat@gmail.com"
            className="inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200 transition-colors"
          >
            <Mail className="w-4 h-4" />
            sopranochat@gmail.com
          </a>
        </Card>
      </section>

      {/* Footer — landing ile birebir */}
      <footer className="relative z-10 px-4 sm:px-8 py-8 border-t border-white/5 mt-4">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" aria-label="Anasayfa">
            <SopranoLogo size="sm" muted />
          </Link>
          <a
            href="mailto:sopranochat@gmail.com"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <Mail className="w-3 h-3" /> sopranochat@gmail.com
          </a>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────── Yardımcı bileşenler ─────────────── */

function Card({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <article className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur">
      <h2 className="flex items-center gap-3 mb-4 text-lg font-bold text-slate-100">
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-extrabold"
          style={{
            background: 'rgba(20, 184, 166, 0.15)',
            border: '1px solid rgba(20, 184, 166, 0.30)',
            color: '#5EEAD4',
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
      <span className="mt-2 w-1 h-1 rounded-full bg-teal-500 shrink-0" aria-hidden="true" />
      <span>
        {label && <strong className="text-slate-200 font-semibold">{label}</strong>}
        {label ? ' — ' : ''}
        {children}
      </span>
    </li>
  );
}

function NoCollect({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-sm text-slate-400 leading-relaxed">
      <span className="text-slate-500 shrink-0 font-bold" aria-hidden="true">
        ✕
      </span>
      <span>{children}</span>
    </li>
  );
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-cyan-300 hover:text-cyan-200 underline decoration-cyan-300/40 underline-offset-2"
    >
      {children}
    </a>
  );
}

/* ─────────────── Logo (landing-new ile birebir aynı) ─────────────── */

function SopranoLogo({
  size = 'md',
  muted = false,
  showTagline = true,
}: {
  size?: 'sm' | 'md' | 'lg';
  muted?: boolean;
  showTagline?: boolean;
}) {
  const sizes = {
    sm: { soprano: 22, chat: 22, tagline: 6.5 },
    md: { soprano: 32, chat: 32, tagline: 9 },
    lg: { soprano: 44, chat: 44, tagline: 11 },
  } as const;
  const s = sizes[size];
  return (
    <div
      className="sc-logo"
      style={{
        opacity: muted ? 0.7 : 1,
        lineHeight: 1,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'baseline',
        paddingBottom: showTagline ? s.tagline + 2 : 0,
      }}
    >
      <span className="sc-logo-soprano" style={{ fontSize: s.soprano, lineHeight: 1 }}>
        Soprano
      </span>
      <span className="sc-logo-chat" style={{ fontSize: s.chat, lineHeight: 1, marginLeft: 1 }}>
        Chat
      </span>
      {showTagline && (
        <span
          className="sc-logo-tagline"
          style={{
            fontSize: s.tagline,
            fontStyle: 'normal',
            position: 'absolute',
            right: 0,
            bottom: 0,
            lineHeight: 1,
          }}
        >
          Senin Sesin
        </span>
      )}
    </div>
  );
}
