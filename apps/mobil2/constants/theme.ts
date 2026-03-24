/** SopranoChat Premium Design Tokens */

// ─────────────────────────────────────────────
// DARK THEME — Mevcut "Siberpunk Kulüp" teması
// ─────────────────────────────────────────────
export const DARK_COLORS = {
  // Backgrounds
  deepNavy: '#060B18',
  darkBg: '#0A0E1A',
  cardBg: 'rgba(255,255,255,0.04)',
  glassBg: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(92,225,230,0.15)',

  // Primary — Turkuaz
  primary: '#5CE1E6',
  primaryDark: '#2BC4C9',
  primaryGlow: 'rgba(92,225,230,0.25)',
  primarySubtle: 'rgba(92,225,230,0.08)',
  primaryStroke: 'rgba(92,225,230,0.30)',

  // Text
  white: '#FFFFFF',
  silver: '#B0B8C4',
  silverLight: '#8892A0',
  silverDark: '#5A6070',
  textMuted: 'rgba(255,255,255,0.35)',

  // Accent
  gold: '#F5C542',
  error: '#EF4444',
  success: '#10B981',

  // Home / Lobby — extended
  vipGold: '#D4AF37',
  vipGoldGlow: 'rgba(212,175,55,0.30)',
  elitePurple: '#8B5CF6',
  elitePurpleGlow: 'rgba(139,92,246,0.25)',
  liveGreen: '#5CE1E6',
  navBarBg: 'rgba(8,14,28,0.82)',
  navBarBorder: 'rgba(92,225,230,0.10)',
  cardGlassBg: 'rgba(12,18,36,0.75)',
  cardGlassBorder: 'rgba(255,255,255,0.06)',
  heroCardBg: 'rgba(10,15,30,0.88)',
  heroCardBorder: 'rgba(92,225,230,0.12)',

  // Wallet / VIP — Gold & Silver accents
  goldMetallic: '#CFB53B',
  goldLight: '#E8D070',
  goldGlow: 'rgba(207,181,59,0.30)',
  goldShimmer: 'rgba(232,208,112,0.15)',
  silverMetallic: '#C0C0C0',
  silverShine: '#E8E8E8',
  silverGlow: 'rgba(192,192,192,0.20)',
  platinumBg: 'rgba(20,28,50,0.92)',

  // Leaderboard — Bronze accent
  bronze: '#CD7F32',
  bronzeLight: '#D4955A',
  bronzeGlow: 'rgba(205,127,50,0.30)',
} as const;

// ─────────────────────────────────────────────
// LIGHT THEME — Premium Banka / Lüks Tasarım
// ─────────────────────────────────────────────
export const LIGHT_COLORS = {
  // Backgrounds — Sıcak porselen, iOS SystemBackground tarzı
  deepNavy: '#F2F2F7',      // iOS systemGroupedBackground
  darkBg:   '#FFFFFF',      // iOS systemBackground (kartlar için)
  cardBg: 'rgba(0,0,0,0.035)',
  glassBg: 'rgba(255,255,255,0.78)',
  glassBorder: 'rgba(0,0,0,0.08)',

  // Primary — Tok, zengin camgöbeği
  primary:       '#0A7E8C',
  primaryDark:   '#086B77',
  primaryGlow:   'rgba(10,126,140,0.15)',
  primarySubtle: 'rgba(10,126,140,0.07)',
  primaryStroke: 'rgba(10,126,140,0.25)',

  // Text — Derin antrasit, keskin kontrast (ASLA soluk gri değil)
  white:      '#1D1D1F',     // Ana metin — koyu antrasit
  silver:     '#3A3A3C',     // Güçlü ikincil metin
  silverLight:'#636366',     // Orta seviye açıklama — iOS secondaryLabel
  silverDark: '#8E8E93',     // Pasif ikon/alt metin — iOS tertiaryLabel
  textMuted:  'rgba(0,0,0,0.22)',

  // Accent
  gold:    '#B8860B',        // DarkGoldenrod — sıcak ve tok
  error:   '#D32F2F',
  success: '#0D7A4F',

  // Home / Lobby — Zengin beyaz cam kartlar
  vipGold:         '#8B7328',
  vipGoldGlow:     'rgba(139,115,40,0.14)',
  elitePurple:     '#5B2D8E',
  elitePurpleGlow: 'rgba(91,45,142,0.12)',
  liveGreen:       '#0A7E8C',
  navBarBg:        'rgba(242,242,247,0.88)',   // Buzlu cam nav
  navBarBorder:    'rgba(0,0,0,0.08)',
  cardGlassBg:     'rgba(255,255,255,0.92)',   // Zengin beyaz kart
  cardGlassBorder: 'rgba(0,0,0,0.06)',
  heroCardBg:      'rgba(255,255,255,0.95)',
  heroCardBorder:  'rgba(0,0,0,0.08)',

  // Wallet / VIP — Mat metalik, zarif tonlar
  goldMetallic:  '#8B7328',
  goldLight:     '#A8923E',
  goldGlow:      'rgba(139,115,40,0.12)',
  goldShimmer:   'rgba(168,146,62,0.10)',
  silverMetallic:'#6D6D72',
  silverShine:   '#8E8E93',
  silverGlow:    'rgba(109,109,114,0.12)',
  platinumBg:    'rgba(242,242,247,0.98)',

  // Leaderboard — Mat bronz
  bronze:      '#8C5E20',
  bronzeLight: '#A67738',
  bronzeGlow:  'rgba(140,94,32,0.12)',
} as const;

// Geçici uyumluluk — mevcut importlar bozulmasın
export const COLORS = DARK_COLORS;

export type ThemeColors = typeof DARK_COLORS;

export const FONTS = {
  thin: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

export const RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
