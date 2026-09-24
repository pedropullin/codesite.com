import { requireAdmin } from "@/lib/auth/session";
import { getCategories } from "@/lib/data/catalog";
import { PageHeader } from "@/components/admin/ui";
import { CategoriesManager } from "@/components/admin/categories-manager";

export const metadata = { title: "Categorias" };

export default async function CategoriesPage() {
  await requireAdmin();
  const categories = await getCategories({ includeInactive: true });
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Catálogo" title="Categorias" description="As quatro primeiras categorias visíveis formam a seção Categories da home, na ordem definida aqui." />
      <CategoriesManager categories={categories} />
    </div>
  );
}
