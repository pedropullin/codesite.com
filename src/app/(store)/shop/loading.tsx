import { ProductCardSkeleton } from "@/components/store/product-card";

export default function ShopLoading() {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto max-w-[1600px] px-5 pb-32 pt-32 md:px-10 md:pt-40">
        <div className="skeleton h-3 w-32" />
        <div className="skeleton mt-6 h-20 w-2/3 md:h-32" />
        <div className="mt-12 h-16 border-y border-ink/10" />
        <div className="mt-14 grid grid-cols-2 gap-x-3 gap-y-12 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
