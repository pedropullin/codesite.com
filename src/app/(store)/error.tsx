"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center gap-8 bg-ink px-6 pt-24 text-center text-bone">
      <p className="label text-steel">Something went wrong</p>
      <h1 className="display-lg">The vault is momentarily closed</h1>
      <p className="max-w-md text-sm text-bone/60">Não foi possível carregar esta página. Tente novamente em instantes.</p>
      <div className="flex gap-3">
        <button type="button" onClick={reset} className="label bg-bone px-7 py-4 text-ink">Tentar novamente</button>
        <Link href="/" className="label border border-white/30 px-7 py-4">Início</Link>
      </div>
    </div>
  );
}
