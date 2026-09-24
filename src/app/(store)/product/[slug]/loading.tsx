export default function ProductLoading() {
  return (
    <div className="min-h-dvh bg-ink">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-5 pb-24 pt-24 md:grid-cols-12 md:gap-8 md:px-10 md:pt-32">
        <div className="skeleton-dark aspect-[4/5] md:col-span-7" />
        <div className="space-y-5 md:col-span-5 md:col-start-8">
          <div className="skeleton-dark h-3 w-40" />
          <div className="skeleton-dark h-14 w-3/4" />
          <div className="skeleton-dark h-5 w-32" />
          <div className="skeleton-dark h-24 w-full" />
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton-dark h-12" />
            ))}
          </div>
          <div className="skeleton-dark h-12 w-full" />
          <div className="skeleton-dark h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
