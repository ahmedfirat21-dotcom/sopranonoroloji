/**
 * POST /api/yonet/frames/ai-generate
 *
 * Kullanıcı prompt'undan çerçeve taslağı üretir.
 *
 * Strateji:
 *  1. ANTHROPIC_API_KEY varsa → Claude'a sor: hangi template + parametreler
 *  2. Yoksa → keyword-bazlı fallback template seçer
 *
 * v2 — Template'ler artık bundle'a gömülü (Vercel read-only FS uyumlu)
 */
import { NextRequest, NextResponse } from 'next/server';
import { TEMPLATE_LIBRARY } from '@/lib/lottie-templates';

interface Template {
  file: string;
  name: string;
  keywords: string[];
  defaultColor: string;
  defaultRarity: string;
}

const TEMPLATES: Template[] = [
  { file: 'SopranoAura.json', name: 'Soprano Aura', keywords: ['turkuaz', 'cyan', 'aura', 'parıltı', 'halka', 'soft'], defaultColor: '#22d3ee', defaultRarity: 'rare' },
  { file: 'SunriseGold.json', name: 'Gold Ring', keywords: ['gold', 'altın', 'sarı', 'sunrise', 'gün', 'amber'], defaultColor: '#fbbf24', defaultRarity: 'rare' },
  { file: 'MidnightAmethyst.json', name: 'Amethyst', keywords: ['mor', 'purple', 'amethyst', 'gece', 'midnight', 'şarap'], defaultColor: '#a855f7', defaultRarity: 'rare' },
  { file: 'OceanPearl.json', name: 'Ocean Pearl', keywords: ['mavi', 'blue', 'ocean', 'okyanus', 'inci', 'pearl', 'deniz'], defaultColor: '#3b82f6', defaultRarity: 'rare' },
  { file: 'RubyFlame.json', name: 'Ruby Flame', keywords: ['kırmızı', 'red', 'ateş', 'flame', 'fire', 'alev', 'ruby', 'yakut'], defaultColor: '#ef4444', defaultRarity: 'legendary' },
  { file: 'NeonPulse.json', name: 'Neon Pulse', keywords: ['neon', 'pembe', 'pink', 'pulse', 'nabız', 'magenta'], defaultColor: '#ec4899', defaultRarity: 'legendary' },
  { file: 'CelestialOrbit.json', name: 'Celestial Orbit', keywords: ['yörünge', 'orbit', 'gezegen', 'space', 'uzay', 'celestial', 'yıldız'], defaultColor: '#8b5cf6', defaultRarity: 'legendary' },
  { file: 'HexPrism.json', name: 'Hex Prism', keywords: ['altıgen', 'hex', 'prizma', 'geometric', 'kristal'], defaultColor: '#06b6d4', defaultRarity: 'rare' },
  { file: 'PulseWave.json', name: 'Pulse Wave', keywords: ['radar', 'wave', 'dalga', 'pulse', 'sonar'], defaultColor: '#10b981', defaultRarity: 'rare' },
  { file: 'EclipseCorona.json', name: 'Eclipse Corona', keywords: ['tutulma', 'eclipse', 'corona', 'güneş', 'sun', 'halka', 'taç'], defaultColor: '#f97316', defaultRarity: 'divine' },
  { file: 'GlitchMatrix.json', name: 'Glitch Matrix', keywords: ['glitch', 'matrix', 'cyber', 'siber', 'sayısal', 'kod'], defaultColor: '#34d399', defaultRarity: 'legendary' },
];

function pickByKeywords(prompt: string): Template {
  const lower = prompt.toLowerCase();
  let best: Template | null = null;
  let bestHits = 0;
  for (const t of TEMPLATES) {
    let hits = 0;
    for (const k of t.keywords) {
      if (lower.includes(k)) hits++;
    }
    if (hits > bestHits) { bestHits = hits; best = t; }
  }
  return best || TEMPLATES[0]; // fallback Soprano Aura
}

function loadTemplate(file: string): any {
  return TEMPLATE_LIBRARY[file] || null;
}

function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/[ğ]/g, 'g').replace(/[ü]/g, 'u').replace(/[ş]/g, 's')
    .replace(/[ı]/g, 'i').replace(/[ö]/g, 'o').replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

// Claude'a sor (varsa)
async function askClaude(prompt: string): Promise<{ template: string; name: string; tagline: string; rarity: string; price: number; color: string } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const systemPrompt = `Sen SopranoChat mağazası için avatar çerçevesi tasarımcısısın. Kullanıcı bir prompt verecek; sen mevcut Lottie template'lerden EN UYGUN olanı seçip parametreleri önereceksin.

Mevcut template'ler:
- SopranoAura.json: turkuaz parıltılı halka
- SunriseGold.json: gold ring (sıcak gün doğumu)
- MidnightAmethyst.json: mor ametist
- OceanPearl.json: mavi okyanus inci
- RubyFlame.json: kırmızı alev
- NeonPulse.json: neon pembe nabız
- CelestialOrbit.json: yörünge yıldız
- HexPrism.json: altıgen kristal
- PulseWave.json: radar dalga
- EclipseCorona.json: tutulma korona
- GlitchMatrix.json: glitch kod

Cevabını SADECE şu JSON formatında ver, hiçbir ek açıklama yapma:
{"template":"DOSYA_ADI.json","name":"Türkçe Çerçeve İsmi","tagline":"Tek satır vurucu açıklama","rarity":"common|uncommon|rare|legendary|divine","price":150,"color":"#hex"}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      console.warn('Claude API error', res.status);
      return null;
    }
    const data = await res.json();
    const text = data?.content?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch (e) {
    console.warn('Claude fetch error', e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const prompt = (body?.prompt || '').toString().trim();
  if (!prompt) return NextResponse.json({ error: 'prompt boş' }, { status: 400 });

  // 1) Claude'a sor (varsa)
  const claude = await askClaude(prompt);
  let chosen: Template;
  let name = '';
  let tagline = '';
  let rarity = 'rare';
  let price = 200;
  let color = '#fbbf24';
  let usedAI = false;

  if (claude) {
    chosen = TEMPLATES.find(t => t.file === claude.template) || pickByKeywords(prompt);
    name = claude.name || chosen.name;
    tagline = claude.tagline || '';
    rarity = claude.rarity || chosen.defaultRarity;
    price = Number.isFinite(claude.price) ? claude.price : 200;
    color = claude.color || chosen.defaultColor;
    usedAI = true;
  } else {
    // 2) Fallback heuristic
    chosen = pickByKeywords(prompt);
    name = `${chosen.name} — ${prompt.slice(0, 30)}`;
    tagline = prompt.length > 60 ? prompt.slice(0, 60) + '…' : prompt;
    rarity = chosen.defaultRarity;
    price = rarity === 'divine' ? 500 : rarity === 'legendary' ? 350 : 200;
    color = chosen.defaultColor;
  }

  // Lottie template'i yükle (bundle'dan)
  const lottieJson = loadTemplate(chosen.file);
  if (!lottieJson) {
    return NextResponse.json({ error: `Template bulunamadı: ${chosen.file}` }, { status: 500 });
  }

  return NextResponse.json({
    lottieJson,
    suggestedForm: {
      id: slugify(name),
      name,
      tagline,
      price_sp: price,
      rarity,
      art_color: color,
    },
    note: usedAI
      ? `Claude'dan taslak alındı: ${chosen.name} template'i seçildi.`
      : `Anahtar kelime eşlemesi ile ${chosen.name} template'i seçildi. Daha akıllı sonuç için ANTHROPIC_API_KEY ekle.`,
  });
}
