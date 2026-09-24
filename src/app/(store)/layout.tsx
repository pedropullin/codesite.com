import { getSettings } from "@/lib/data/settings";
import { getCategories } from "@/lib/data/catalog";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { CartDrawer } from "@/components/store/cart-drawer";
import { StoreProviders } from "@/components/store/store-providers";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  return (
    <div className="theme-store min-h-dvh">
      <a href="#main" className="label sr-only z-[300] bg-bone px-4 py-3 text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Pular para o conteúdo
      </a>
      <StoreProviders />
      <Header
        brandName={settings.brand.name}
        logoUrl={settings.brand.logoUrl}
        announcement={settings.texts.announcement}
        instagram={settings.contact.instagram}
        whatsapp={settings.contact.whatsapp}
        email={settings.contact.email}
      />
      <main id="main">{children}</main>
      <Footer settings={settings} categories={categories} />
      <CartDrawer shippingNote={settings.texts.shippingNote} />
    </div>
  );
}
