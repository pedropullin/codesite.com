import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/catalog";
import { getSettings } from "@/lib/data/settings";
import { ProductView } from "@/components/product/product-view";
import { ProductCard } from "@/components/store/product-card";
import { Reveal, TextReveal } from "@/components/store/reveal";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produto não encontrado" };
  return {
    title: product.name,
    description: `${product.description.slice(0, 150)} — ${formatPrice(product.effectivePrice)}`,
    openGraph: { images: product.image ? [{ url: product.image }] : undefined },
  };
}

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const [related, settings] = await Promise.all([getRelatedProducts(product, 4), getSettings()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description,
    image: product.images,
    brand: { "@type": "Brand", name: settings.brand.name },
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (product.effectivePrice / 100).toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    },
  };

  return (
    <ViewTransition enter="page-fade" exit="page-fade" default="none">
      <div className="bg-ink text-bone">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <div className="mx-auto max-w-[1600px] px-5 pb-24 pt-24 md:px-10 md:pt-32">
          <ProductView product={product} whatsapp={settings.contact.whatsapp} shippingNote={settings.texts.shippingNote} />
        </div>
        {related.length > 0 && (
          <section className="border-t border-white/10 bg-ink-soft py-24 md:py-32" aria-label="You may also like">
            <div className="mx-auto max-w-[1600px] px-5 md:px-10">
              <div className="flex items-end justify-between gap-6">
                <TextReveal as="h2" text="You may also like" className="display-lg block" />
                <p className="label-sm hidden text-steel md:block">Selected from the archive</p>
              </div>
              <div className="mt-14 grid grid-cols-2 gap-x-3 gap-y-12 md:grid-cols-4 md:gap-x-6">
                {related.map((p, i) => (
                  <Reveal key={p.id} y={24} delay={i * 0.06}>
                    <ProductCard product={p} tone="dark" sizes="(max-width: 768px) 50vw, 25vw" />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}
        <div className="h-16 md:hidden" />
      </div>
    </ViewTransition>
  );
}
