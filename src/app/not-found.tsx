import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-ink px-6 text-center text-bone">
      <p className="label text-steel">Error 404 — Not in the archive</p>
      <h1 className="display-xl">Empty vault</h1>
      <p className="max-w-md text-sm leading-relaxed text-bone/60">
        A página que você procura não existe ou foi retirada do arquivo.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="label bg-bone px-7 py-4 text-ink">Voltar ao início</Link>
        <Link href="/shop" className="label border border-white/30 px-7 py-4">Ver a loja</Link>
      </div>
    </div>
  );
}
