import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Vault Association — The Vault of Exclusivity",
    template: "%s — Vault Association",
  },
  description:
    "Vault Association: objetos e vestuário de edição limitada. Uma experiência de curadoria, exclusividade e identidade.",
  applicationName: "Vault Association",
  authors: [{ name: "CodeSite" }],
  creator: "CodeSite",
  openGraph: {
    type: "website",
    siteName: "Vault Association",
    locale: "pt_BR",
    images: [{ url: "/renders/hero-poster.webp", width: 1920, height: 1200, alt: "Vault Association — caixa preta fosca com logotipo em baixo-relevo" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/renders/hero-poster.webp"],
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
