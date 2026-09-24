import type { Metadata } from "next";
import { ViewTransition } from "react";
import { getCatalogFacets, getCategories, getProducts, type CatalogSort } from "@/lib/data/catalog";
import { ProductCard } from "@/components/store/product-card";
import { ClearFilters, PendingArea, ShopToolbar, ShopTransition } from "@/components/shop/shop-controls";
import { Reveal } from "@/components/store/reveal";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/shop">): Promise<Metadata> {
  const sp = await props.searchParams;
  const cat = typeof sp.category === "string" ? sp.category : "";
  return { title: cat ? `${cat.charAt(0).toUpperCase()}${cat.slice(1)} — Shop` : "Shop", description: "O arquivo completo da Vault Association." };
}

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
const num = (v: string | string[] | undefined) => {
  const n = Number(str(v));
  return Number.isFinite(n) && str(v) ? n : undefined;
};

export default async function ShopPage(props: PageProps<"/shop">) {
  const sp = await props.searchParams;
  const category = str(sp.category);
  const filter = str(sp.filter);
  const sort = (str(sp.sort) as CatalogSort | undefined) ?? "featured";
  const [categories, facets, products] = await Promise.all([
    getCategories(),
    getCatalogFacets(),
    getProducts({
      q: str(sp.q),
      category,
      sort,
      minPrice: num(sp.min),
      maxPrice: num(sp.max),
      availability: str(sp.availability) === "in-stock" ? "in-stock" : str(sp.availability) === "sold-out" ? "sold-out" : undefined,
      featured: filter === "featured",
      isNew: filter === "new",
      onSale: filter === "sale",
      size: str(sp.size),
      color: str(sp.color),
    }),
  ]);
  const current = categories.find((c) => c.slug === category);
  const title = current?.name ?? (filter === "new" ? "New arrivals" : filter === "featured" ? "Featured" : filter === "sale" ? "Sale" : "The Archive");

  return (
    <ViewTransition enter="page-fade" exit="page-fade" default="none">
      <div className="min-h-dvh bg-paper text-ink">
        <ShopTransition>
          <div className="mx-auto max-w-[1600px] px-5 pb-32 pt-32 md:px-10 md:pt-40">
            <div className="flex flex-col gap-6 pb-10 md:pb-14">
              <div className="min-w-0">
                <p className="label text-ink/50">Shop — {String(products.length).padStart(2, "0")} {products.length === 1 ? "piece" : "pieces"}</p>
                <h1 className="display-xl mt-5">{title}</h1>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-ink/60 md:self-end">
                {current?.description ?? "O arquivo completo da Vault Association. Peças numeradas, produção limitada e sem reposição garantida."}
              </p>
            </div>
            <ShopToolbar categories={categories} facets={facets} total={products.length} />
            <PendingArea>
              {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-6 py-40 text-center">
                  <div className="relative h-20 w-28 border border-ink/15">
                    <div className="absolute inset-x-3 top-3 h-px bg-ink/15" />
                    <div className="absolute left-1/2 top-1/2 h-4 w-8 -translate-x-1/2 -translate-y-1/2 border border-ink/25" />
                  </div>
                  <p className="display-md">Nothing in the vault</p>
                  <p className="max-w-sm text-sm text-ink/60">Nenhuma peça corresponde à sua busca. Ajuste os filtros ou explore o arquivo completo.</p>
                  <ClearFilters />
                </div>
              ) : (
                <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-12 md:mt-14 md:grid-cols-3 md:gap-x-6 md:gap-y-16 xl:grid-cols-4">
                  {products.map((p, i) => (
                    <Reveal key={p.id} y={24} delay={(i % 4) * 0.06} amount={0.1}>
                      <ProductCard product={p} morph priority={i < 4} sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw" />
                    </Reveal>
                  ))}
                </div>
              )}
            </PendingArea>
          </div>
        </ShopTransition>
      </div>
    </ViewTransition>
  );
}
