import { requireAdmin } from "@/lib/auth/session";
import { getSettings } from "@/lib/data/settings";
import { listAdminProducts } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/ui";
import { SettingsManager } from "@/components/admin/settings-manager";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  await requireAdmin();
  const [settings, products] = await Promise.all([getSettings(), listAdminProducts({ status: "active" })]);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Loja" title="Configurações" description="Tudo o que for salvo aqui é publicado na loja imediatamente." />
      <SettingsManager settings={settings} products={products.map((p) => ({ slug: p.slug, name: p.name }))} />
    </div>
  );
}
