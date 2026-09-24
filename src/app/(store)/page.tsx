import { ViewTransition } from "react";
import { getSettings } from "@/lib/data/settings";
import { getCategories, getProductBySlug, getProducts, getSpotlightProduct } from "@/lib/data/catalog";
import { HeroExperience } from "@/components/home/hero/hero-experience";
import { floatingCount } from "@/components/home/hero/floating-items";
import { BrandSection } from "@/components/home/brand-section";
import { CollectionSection } from "@/components/home/collection-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { FeaturedSection } from "@/components/home/featured-section";
import { GallerySection } from "@/components/home/gallery-section";
import { CatalogPreview } from "@/components/home/catalog-preview";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSettings();
  const [featured, categories, spotlight, latest, heroDetail] = await Promise.all([
    getProducts({ featured: true }),
    getCategories(),
    getSpotlightProduct(settings.featured.productSlug),
    getProducts({ sort: "newest", limit: 8 }),
    settings.featured.heroProductSlug ? getProductBySlug(settings.featured.heroProductSlug) : Promise.resolve(null),
  ]);
  const heroProduct = heroDetail ?? featured[0] ?? latest[0] ?? null;
  const collection = featured.length >= 3 ? featured : [...featured, ...latest.filter((l) => !featured.some((f) => f.id === l.id))];

  return (
    <ViewTransition enter="page-fade" exit="page-fade" default="none">
      <div>
        <HeroExperience
          hero={settings.hero}
          brandName={settings.brand.name}
          collectionLabel={settings.featured.collectionLabel}
          foundedYear={settings.brand.foundedYear}
          heroProduct={heroProduct}
          fallbackImages={["/renders/tag925-2.webp", "/renders/runner-black-1.webp", "/renders/tee-black-2.webp", "/renders/ring-1.webp"]}
          objectCount={floatingCount("high")}
        />
        <BrandSection brand={settings.brand} statement={settings.texts.brandStatement} />
        <CollectionSection products={collection.slice(0, 6)} title={settings.texts.collectionTitle} intro={settings.texts.collectionIntro} label={settings.featured.collectionLabel} />
        <CategoriesSection categories={categories} title={settings.texts.categoriesTitle} intro={settings.texts.categoriesIntro} />
        {spotlight && <FeaturedSection product={spotlight} label={settings.texts.featuredLabel} image={settings.featured.image} />}
        <GallerySection items={settings.banners.items} title={settings.texts.galleryTitle} />
        <CatalogPreview products={latest} categories={categories} title={settings.texts.catalogTitle} intro={settings.texts.catalogIntro} />
      </div>
    </ViewTransition>
  );
}
