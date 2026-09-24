"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import type { AdminProduct } from "@/lib/data/admin";
import { formatPrice, parsePriceToCents, slugify } from "@/lib/format";
import { toast } from "@/lib/client/toast-store";
import { saveProductAction } from "@/app/admin/(panel)/actions";
import { ImageListEditor } from "./image-uploader";
import { Modal } from "./modal";
import { Button, Field, Input, Select, Switch, Textarea } from "./ui";
import { cn } from "@/lib/utils";

type Category = { id: number; name: string };
type Color = { name: string; hex: string; image?: string };

type Draft = {
  id?: number;
  name: string;
  slug: string;
  sku: string;
  categoryId: number | null;
  price: string;
  salePrice: string;
  description: string;
  details: string;
  images: string[];
  sizes: string[];
  colors: Color[];
  label: string;
  active: boolean;
  featured: boolean;
  isNew: boolean;
  stock: Record<string, { stock: number; price: string }>;
};

const key = (s: string | null, c: string | null) => `${s ?? ""}::${c ?? ""}`;
const centsToInput = (c: number | null | undefined) => (c ? (c / 100).toFixed(2).replace(".", ",") : "");

function fromProduct(p?: AdminProduct): Draft {
  if (!p) {
    return {
      name: "", slug: "", sku: "", categoryId: null, price: "", salePrice: "", description: "", details: "",
      images: [], sizes: [], colors: [], label: "", active: true, featured: false, isNew: true, stock: {},
    };
  }
  const stock: Draft["stock"] = {};
  p.variants.forEach((v) => (stock[key(v.size, v.color)] = { stock: v.stock, price: centsToInput(v.price) }));
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    categoryId: p.categoryId,
    price: centsToInput(p.price),
    salePrice: centsToInput(p.salePrice),
    description: p.description,
    details: p.details.join("\n"),
    images: p.images,
    sizes: p.sizes,
    colors: p.colors,
    label: p.label ?? "",
    active: p.active,
    featured: p.featured,
    isNew: p.isNew,
    stock,
  };
}

const SIZE_PRESETS = [
  { label: "P · M · G · GG", sizes: ["P", "M", "G", "GG"] },
  { label: "38 – 44", sizes: ["38", "39", "40", "41", "42", "43", "44"] },
  { label: "Tamanho único", sizes: ["Único"] },
];

export function ProductEditor({
  open,
  onClose,
  product,
  categories,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  product?: AdminProduct;
  categories: Category[];
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => fromProduct(product));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sizeInput, setSizeInput] = useState("");
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<"info" | "media" | "variants">("info");

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const variants = useMemo(() => {
    const sizes = draft.sizes.length ? draft.sizes : [null];
    const colors = draft.colors.length ? draft.colors.map((c) => c.name) : [null];
    return colors.flatMap((c) => sizes.map((s) => ({ size: s, color: c, k: key(s, c) })));
  }, [draft.sizes, draft.colors]);
  const totalStock = variants.reduce((a, v) => a + (draft.stock[v.k]?.stock ?? 0), 0);

  const addSize = (s: string) => {
    const v = s.trim();
    if (!v || draft.sizes.includes(v)) return;
    set("sizes", [...draft.sizes, v]);
  };

  const save = () => {
    const price = parsePriceToCents(draft.price);
    const sale = parsePriceToCents(draft.salePrice);
    const local: Record<string, string> = {};
    if (!draft.name.trim()) local.name = "Informe o nome";
    if (!draft.sku.trim()) local.sku = "Informe o SKU";
    if (!price) local.price = "Informe o preço";
    if (sale && price && sale >= price) local.salePrice = "Deve ser menor que o preço";
    if (draft.colors.some((c) => !c.name.trim())) local.colors = "Toda cor precisa de um nome";
    setErrors(local);
    if (Object.keys(local).length) {
      setTab("info");
      toast({ title: "Revise os campos destacados", tone: "error" });
      return;
    }
    startTransition(async () => {
      const res = await saveProductAction({
        id: draft.id,
        name: draft.name,
        slug: draft.slug || undefined,
        sku: draft.sku,
        categoryId: draft.categoryId,
        price: price!,
        salePrice: sale,
        description: draft.description,
        details: draft.details.split("\n").map((l) => l.trim()).filter(Boolean),
        images: draft.images,
        sizes: draft.sizes,
        colors: draft.colors.map((c) => ({ name: c.name.trim(), hex: c.hex, ...(c.image ? { image: c.image } : {}) })),
        label: draft.label.trim() || null,
        active: draft.active,
        featured: draft.featured,
        isNew: draft.isNew,
        variants: variants.map((v) => ({
          size: v.size,
          color: v.color,
          stock: Math.max(0, Math.floor(draft.stock[v.k]?.stock ?? 0)),
          price: parsePriceToCents(draft.stock[v.k]?.price ?? "") ?? null,
        })),
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast({ title: res.error, tone: "error" });
        return;
      }
      toast({ title: res.message ?? "Salvo", description: "As alterações já estão no site.", tone: "success" });
      onSaved();
      onClose();
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={draft.id ? `Editar — ${product?.name}` : "Novo produto"}
      description={draft.id ? `SKU ${product?.sku}` : "Preencha as informações. Produtos ativos aparecem no catálogo imediatamente."}
      footer={
        <>
          <span className="mr-auto text-xs text-muted-foreground">{variants.length} variações · {totalStock} un. em estoque</span>
          <Button variant="outline" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button onClick={save} loading={pending}>{draft.id ? "Salvar alterações" : "Criar produto"}</Button>
        </>
      }
    >
      <div role="tablist" className="mb-6 flex gap-1 rounded-lg bg-muted p-1 text-sm">
        {[
          { v: "info", l: "Informações" },
          { v: "media", l: `Imagens (${draft.images.length})` },
          { v: "variants", l: `Variações e estoque (${variants.length})` },
        ].map((t) => (
          <button
            key={t.v}
            type="button"
            role="tab"
            aria-selected={tab === t.v}
            onClick={() => setTab(t.v as typeof tab)}
            className={cn("flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors", tab === t.v ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Nome" htmlFor="p-name" error={errors.name} className="md:col-span-2">
            <Input
              id="p-name"
              value={draft.name}
              aria-invalid={!!errors.name}
              onChange={(e) => {
                const name = e.target.value;
                setDraft((d) => ({ ...d, name, slug: d.id ? d.slug : slugify(name) }));
              }}
            />
          </Field>
          <Field label="SKU" htmlFor="p-sku" error={errors.sku} hint="Base para os SKUs das variações">
            <Input id="p-sku" value={draft.sku} aria-invalid={!!errors.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} placeholder="VA-CL-006" />
          </Field>
          <Field label="Slug (URL)" htmlFor="p-slug" hint={`/product/${draft.slug || "…"}`}>
            <Input id="p-slug" value={draft.slug} onChange={(e) => set("slug", slugify(e.target.value))} />
          </Field>
          <Field label="Categoria" htmlFor="p-cat">
            <Select id="p-cat" value={draft.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value ? Number(e.target.value) : null)}>
              <option value="">Sem categoria</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Etiqueta editorial" htmlFor="p-label" hint='Ex.: "Edition 001 / 250" (opcional)'>
            <Input id="p-label" value={draft.label} onChange={(e) => set("label", e.target.value)} />
          </Field>
          <Field label="Preço (R$)" htmlFor="p-price" error={errors.price} hint={parsePriceToCents(draft.price) ? formatPrice(parsePriceToCents(draft.price)!) : undefined}>
            <Input id="p-price" inputMode="decimal" value={draft.price} aria-invalid={!!errors.price} onChange={(e) => set("price", e.target.value)} placeholder="390,00" />
          </Field>
          <Field label="Preço promocional (R$)" htmlFor="p-sale" error={errors.salePrice} hint="Deixe vazio para não aplicar promoção">
            <Input id="p-sale" inputMode="decimal" value={draft.salePrice} aria-invalid={!!errors.salePrice} onChange={(e) => set("salePrice", e.target.value)} placeholder="—" />
          </Field>
          <Field label="Descrição" htmlFor="p-desc" className="md:col-span-2">
            <Textarea id="p-desc" rows={4} value={draft.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field label="Detalhes" htmlFor="p-details" hint="Um item por linha (materiais, acabamentos, cuidados)" className="md:col-span-2">
            <Textarea id="p-details" rows={4} value={draft.details} onChange={(e) => set("details", e.target.value)} />
          </Field>
          <div className="grid gap-3 rounded-lg border border-border p-4 md:col-span-2 md:grid-cols-3">
            {[
              { k: "active" as const, l: "Ativo", d: "Visível na loja" },
              { k: "featured" as const, l: "Destaque", d: "Aparece em The Collection" },
              { k: "isNew" as const, l: "Novidade", d: 'Selo "New" e filtro novidades' },
            ].map((f) => (
              <label key={f.k} className="flex items-center justify-between gap-3">
                <span>
                  <span className="block text-sm font-medium">{f.l}</span>
                  <span className="block text-xs text-muted-foreground">{f.d}</span>
                </span>
                <Switch checked={draft[f.k]} onChange={(v) => set(f.k, v)} label={f.l} />
              </label>
            ))}
          </div>
        </div>
      )}

      {tab === "media" && <ImageListEditor value={draft.images} onChange={(v) => set("images", v)} />}

      {tab === "variants" && (
        <div className="space-y-8">
          <section>
            <h3 className="text-sm font-semibold">Tamanhos</h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {draft.sizes.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs">
                  {s}
                  <button type="button" aria-label={`Remover ${s}`} onClick={() => set("sizes", draft.sizes.filter((x) => x !== s))} className="text-muted-foreground hover:text-foreground">✕</button>
                </span>
              ))}
              <Input
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addSize(sizeInput);
                    setSizeInput("");
                  }
                }}
                placeholder="Novo tamanho + Enter"
                className="h-8 w-44 text-xs"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {SIZE_PRESETS.map((p) => (
                <button key={p.label} type="button" onClick={() => set("sizes", p.sizes)} className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  Usar {p.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Cores</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => set("colors", [...draft.colors, { name: "", hex: "#111112" }])}>
                <Plus /> Adicionar cor
              </Button>
            </div>
            {errors.colors && <p className="mt-2 text-xs text-red-600">{errors.colors}</p>}
            {draft.colors.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">Sem variação de cor.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {draft.colors.map((c, i) => (
                  <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2">
                    <input
                      type="color"
                      aria-label="Cor"
                      value={c.hex}
                      onChange={(e) => set("colors", draft.colors.map((x, k) => (k === i ? { ...x, hex: e.target.value } : x)))}
                      className="h-9 w-10 cursor-pointer rounded-md border border-input bg-card p-1"
                    />
                    <Input
                      value={c.name}
                      placeholder="Nome (ex.: Black)"
                      className="h-9"
                      onChange={(e) => {
                        const oldName = c.name;
                        const name = e.target.value;
                        setDraft((d) => {
                          const stock = { ...d.stock };
                          d.sizes.concat(d.sizes.length ? [] : [null as unknown as string]).forEach((s) => {
                            const from = key(s ?? null, oldName);
                            if (stock[from]) stock[key(s ?? null, name)] = stock[from];
                          });
                          return { ...d, stock, colors: d.colors.map((x, k) => (k === i ? { ...x, name } : x)) };
                        });
                      }}
                    />
                    <Select value={c.image ?? ""} onChange={(e) => set("colors", draft.colors.map((x, k) => (k === i ? { ...x, image: e.target.value || undefined } : x)))} className="h-9 text-xs">
                      <option value="">Imagem da cor (opcional)</option>
                      {draft.images.map((img, k) => <option key={img} value={img}>Imagem {k + 1}</option>)}
                    </Select>
                    <button type="button" aria-label="Remover cor" onClick={() => set("colors", draft.colors.filter((_, k) => k !== i))} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold">Estoque por variação</h3>
            <p className="mt-1 text-xs text-muted-foreground">Preço específico é opcional — quando vazio vale o preço do produto.</p>
            <div className="mt-3 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Variação</th>
                    <th className="w-28 px-3 py-2 font-medium">Estoque</th>
                    <th className="w-36 px-3 py-2 font-medium">Preço específico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {variants.map((v) => (
                    <tr key={v.k}>
                      <td className="px-3 py-2">
                        {[v.color, v.size].filter(Boolean).join(" · ") || "Variação única"}
                      </td>
                      <td className="px-3 py-1.5">
                        <Input
                          type="number"
                          min={0}
                          aria-label={`Estoque ${v.k}`}
                          value={draft.stock[v.k]?.stock ?? 0}
                          onChange={(e) => setDraft((d) => ({ ...d, stock: { ...d.stock, [v.k]: { price: d.stock[v.k]?.price ?? "", stock: Math.max(0, Number(e.target.value) || 0) } } }))}
                          className="h-8"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <Input
                          inputMode="decimal"
                          aria-label={`Preço ${v.k}`}
                          value={draft.stock[v.k]?.price ?? ""}
                          placeholder="—"
                          onChange={(e) => setDraft((d) => ({ ...d, stock: { ...d.stock, [v.k]: { stock: d.stock[v.k]?.stock ?? 0, price: e.target.value } } }))}
                          className="h-8"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}
