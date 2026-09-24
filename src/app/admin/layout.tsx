import type { Metadata } from "next";
import { Toaster } from "@/components/store/toaster";

export const metadata: Metadata = {
  title: { default: "Vault Admin", template: "%s — Vault Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {children}
      <Toaster theme="light" />
    </div>
  );
}
