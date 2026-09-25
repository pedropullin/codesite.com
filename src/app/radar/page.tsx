import type { Metadata, Viewport } from "next";
import RadarApp from "@/components/radar/RadarApp";

export const metadata: Metadata = {
  title: "Radar — clientes sem site",
  description: "Encontre comércios sem site perto de você e acompanhe cada conversa.",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Radar", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#2b46ff",
};

export default function RadarPage() {
  return <RadarApp />;
}
