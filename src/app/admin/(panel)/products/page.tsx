import { listAdminProducts } from "@/lib/data/admin";
import { getCategories } from "@/lib/data/catalog";
import { PageHeader } from "@/components/admin/ui";
import { ProductsManager } from "@/components/admin/products-manager";
import { requireAdmin } from "@/lib/auth/session";

export const metadata = { title: "Produtos" };

export default async function ProductsPage(props: PageProps<"/admin/products">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  const [products, categories] = await Promise.all([
    listAdminProducts({ q: str(sp.q), category: str(sp.category), status: str(sp.status) }),
    getCategories({ includeInactive: true }),
  ]);
  const total = products.length;
  const stock = products.reduce((a, p) => a + p.stock, 0);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catálogo"
        title="Produtos"
        description={`${total} ${total === 1 ? "produto" : "produtos"} · ${stock} unidades em estoque. Alterações refletem na loja imediatamente.`}
      />
      <ProductsManager products={products} categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))} />
    </div>
  );
}
