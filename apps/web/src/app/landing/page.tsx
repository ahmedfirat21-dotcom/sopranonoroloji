import type { Metadata } from "next";
import LandingPage from "./LandingPage";

export const metadata: Metadata = {
  title: "SopranoChat — Senin Sesin, Senin Kuralların",
  description:
    "Seçkinlerin dijital kulübüne hoş geldin. SopranoChat ile localar kur, yetkilerini yönet ve kendi ekonomini yarat. Sesli sohbet platformu.",
  keywords: [
    "SopranoChat",
    "sesli sohbet",
    "voice chat",
    "loca",
    "VIP",
    "dijital kulüp",
    "sosyal platform",
  ],
  openGraph: {
    title: "SopranoChat — Senin Sesin, Senin Kuralların",
    description:
      "Seçkinlerin dijital kulübüne hoş geldin. Localar kur, yetki sat, ekonomini yarat.",
    type: "website",
    url: "https://sopranochat.com/landing",
  },
};

export default function LandingRoute() {
  return <LandingPage />;
}
