"use client";

import { Copy, Pencil, Plus, Search, Star, Trash2, Boxes } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import type { AdminProduct } from "@/lib/data/admin";
import { formatPrice } from "@/lib/format";
import { toast } from "@/lib/client/toast-store";
import { deleteProductAction, duplicateProductAction, setProductFlagAction, setVariantStockAction } from "@/app/admin/(panel)/actions";
import { ConfirmDialog, Modal } from "./modal";
import { ProductEditor } from "./product-editor";
import { Badge, Button, Card, EmptyState, Input, Select, Switch } from "./ui";
import { cn } from "@/lib/utils";

type Category = { id: number; name: string; slug: string };

export function ProductsManager({ products, categories }: { products: AdminProduct[]; categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<AdminProduct | "new" | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [deleting, setDeleting] = useState<AdminProduct | null>(null);
  const [stockFor, setStockFor] = useState<AdminProduct | null>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState(params.get("q") ?? "");

  const [optimistic, applyOptimistic] = useOptimistic(products, (state, patch: { id: number; field: "active" | "featured" | "isNew"; value: boolean }) =>
    state.map((p) => (p.id === patch.id ? { ...p, [patch.field]: patch.value } : p)),
  );

  // ?edit=<id> opens the editor directly (links from the dashboard).
  const editFromUrl = products.find((x) => x.id === Number(params.get("edit")));
  const shownEditor = editing ?? editFromUrl ?? null;

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params.toString());
    if (v) next.set(k, v);
    else next.delete(k);
    next.delete("edit");
    router.replace(`${pathname}?${next.toString()}`);
  };

  const refresh = () => startTransition(() => router.refresh());

  const toggle = (p: AdminProduct, field: "active" | "featured" | "isNew", value: boolean) => {
    startTransition(async () => {
      applyOptimistic({ id: p.id, field, value });
      const res = await setProductFlagAction(p.id, field, value);
      if (!res.ok) toast({ title: res.error, tone: "error" });
      router.refresh();
    });
  };

  const openEditor = (p: AdminProduct | "new") => {
    setEditing(p);
    setEditorKey((k) => k + 1);
  };

  return (
    <>
      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
          <form
            className="relative md:w-80"
            onSubmit={(e) => {
              e.preventDefault();
              setParam("q", q.trim());
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou SKU" className="pl-9" aria-label="Buscar produtos" />
          </form>
          <div className="flex flex-wrap items-center gap-2">
            <Select aria-label="Categoria" value={params.get("category") ?? ""} onChange={(e) => setParam("category", e.target.value)} className="h-9 w-40 text-xs">
              <option value="">Todas as categorias</option>
              {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </Select>
            <Select aria-label="Status" value={params.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value)} className="h-9 w-40 text-xs">
              <option value="">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="featured">Em destaque</option>
              <option value="new">Novidades</option>
              <option value="low-stock">Estoque baixo</option>
              <option value="sold-out">Esgotados</option>
            </Select>
            <Button onClick={() => openEditor("new")}><Plus /> Novo produto</Button>
          </div>
        </div>

        {optimistic.length === 0 ? (
          <EmptyState
            title="Nenhum produto encontrado"
            description="Ajuste os filtros ou cadastre um novo produto — ele aparece no catálogo assim que for ativado."
            action={<Button size="sm" onClick={() => openEditor("new")}><Plus /> Novo produto</Button>}
          />
        ) : (
          <>
          <ul className="divide-y divide-border md:hidden">
            {optimistic.map((p) => (
              <li key={p.id} className={cn("px-4 py-3", !p.active && "opacity-60")}>
                <div className="flex items-start gap-3">
                  <button type="button" onClick={() => openEditor(p)} className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md bg-[#ecebe6]" aria-label={`Editar ${p.name}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-contain p-0.5" loading="lazy" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <button type="button" onClick={() => openEditor(p)} className="block max-w-full truncate text-left text-sm font-medium">{p.name}</button>
                    <p className="truncate text-xs text-muted-foreground">{p.sku} · {p.categoryName ?? "Sem categoria"}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="font-medium tabular-nums">{formatPrice(p.salePrice ?? p.price)}</span>
                      <button type="button" onClick={() => setStockFor(p)} className="tabular-nums">
                        {p.stock <= 0 ? <Badge tone="danger">Esgotado</Badge> : <Badge tone={p.variants.some((v) => v.stock > 0 && v.stock <= 3) ? "warning" : "neutral"}>{p.stock} un.</Badge>}
                      </button>
                      <span className="text-muted-foreground">{p.sold} vendidos</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <label className="flex items-center gap-1.5"><Switch size="sm" checked={p.active} onChange={(v) => toggle(p, "active", v)} label={`Ativar ${p.name}`} /> Ativo</label>
                    <label className="flex items-center gap-1.5"><Switch size="sm" checked={p.isNew} onChange={(v) => toggle(p, "isNew", v)} label={`Novidade ${p.name}`} /> Novo</label>
                    <button type="button" aria-pressed={p.featured} aria-label={`Destacar ${p.name}`} onClick={() => toggle(p, "featured", !p.featured)} className={cn("flex items-center gap-1", p.featured ? "text-foreground" : "")}>
                      <Star className="h-4 w-4" fill={p.featured ? "currentColor" : "none"} /> Destaque
                    </button>
                  </div>
                  <div className="flex">
                    <IconBtn label="Duplicar" onClick={async () => { const res = await duplicateProductAction(p.id); toast({ title: res.ok ? res.message ?? "Duplicado" : res.error, tone: res.ok ? "success" : "error" }); refresh(); }}><Copy /></IconBtn>
                    <IconBtn label="Excluir" danger onClick={() => setDeleting(p)}><Trash2 /></IconBtn>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 text-right font-medium">Preço</th>
                  <th className="px-4 py-3 text-right font-medium">Estoque</th>
                  <th className="px-4 py-3 text-right font-medium">Vendidos</th>
                  <th className="px-4 py-3 text-center font-medium">Ativo</th>
                  <th className="px-4 py-3 text-center font-medium">Destaque</th>
                  <th className="px-4 py-3 text-center font-medium">Novidade</th>
                  <th className="px-4 py-3 text-right font-medium"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {optimistic.map((p) => {
                  const low = p.variants.some((v) => v.stock > 0 && v.stock <= 3);
                  return (
                    <tr key={p.id} className={cn("transition-colors hover:bg-muted/40", !p.active && "opacity-60")}>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => openEditor(p)} className="flex items-center gap-3 text-left">
                          <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-[#ecebe6]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-contain p-0.5" loading="lazy" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block max-w-[260px] truncate font-medium">{p.name}</span>
                            <span className="block text-xs text-muted-foreground">{p.sku} · {p.variants.length} {p.variants.length === 1 ? "variação" : "variações"}</span>
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.categoryName ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {p.salePrice ? (
                          <>
                            <span className="block">{formatPrice(p.salePrice)}</span>
                            <span className="block text-xs text-muted-foreground line-through">{formatPrice(p.price)}</span>
                          </>
                        ) : (
                          formatPrice(p.price)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => setStockFor(p)} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 tabular-nums hover:bg-muted" title="Alterar estoque">
                          {p.stock <= 0 ? <Badge tone="danger">Esgotado</Badge> : low ? <Badge tone="warning">{p.stock} un.</Badge> : <span>{p.stock} un.</span>}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{p.sold}</td>
                      <td className="px-4 py-3 text-center"><Switch size="sm" checked={p.active} onChange={(v) => toggle(p, "active", v)} label={`Ativar ${p.name}`} /></td>
                      <td className="px-4 py-3 text-center">
                        <button type="button" aria-pressed={p.featured} aria-label={`Destacar ${p.name}`} onClick={() => toggle(p, "featured", !p.featured)} className={cn("rounded-md p-1.5 transition-colors hover:bg-muted", p.featured ? "text-foreground" : "text-muted-foreground/40")}>
                          <Star className="h-4 w-4" fill={p.featured ? "currentColor" : "none"} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center"><Switch size="sm" checked={p.isNew} onChange={(v) => toggle(p, "isNew", v)} label={`Marcar ${p.name} como novidade`} /></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-0.5">
                          <IconBtn label="Editar" onClick={() => openEditor(p)}><Pencil /></IconBtn>
                          <IconBtn label="Alterar estoque" onClick={() => setStockFor(p)}><Boxes /></IconBtn>
                          <IconBtn
                            label="Duplicar"
                            onClick={async () => {
                              const res = await duplicateProductAction(p.id);
                              toast({ title: res.ok ? res.message ?? "Duplicado" : res.error, tone: res.ok ? "success" : "error" });
                              refresh();
                            }}
                          >
                            <Copy />
                          </IconBtn>
                          <IconBtn label="Excluir" danger onClick={() => setDeleting(p)}><Trash2 /></IconBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </Card>

      {shownEditor && (
        <ProductEditor
          key={editing ? editorKey : `url-${editFromUrl?.id}`}
          open
          product={shownEditor === "new" ? undefined : shownEditor}
          categories={categories}
          onClose={() => {
            setEditing(null);
            if (params.get("edit")) setParam("edit", "");
          }}
          onSaved={refresh}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        danger
        loading={busy}
        title={`Excluir “${deleting?.name}”?`}
        description="O produto e suas variações serão removidos da loja. Pedidos antigos mantêm o histórico. Esta ação não pode ser desfeita — considere apenas desativar."
        confirmLabel="Excluir definitivamente"
        onConfirm={async () => {
          if (!deleting) return;
          setBusy(true);
          const res = await deleteProductAction(deleting.id);
          setBusy(false);
          setDeleting(null);
          toast({ title: res.ok ? res.message ?? "Excluído" : res.error, tone: res.ok ? "success" : "error" });
          refresh();
        }}
      />

      {stockFor && <StockModal product={stockFor} onClose={() => setStockFor(null)} onSaved={refresh} />}
    </>
  );
}

function IconBtn({ label, onClick, children, danger }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={cn("rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted [&_svg]:h-4 [&_svg]:w-4", danger ? "hover:text-red-600" : "hover:text-foreground")}>
      {children}
    </button>
  );
}

function StockModal({ product, onClose, onSaved }: { product: AdminProduct; onClose: () => void; onSaved: () => void }) {
  const [values, setValues] = useState(() => Object.fromEntries(product.variants.map((v) => [v.id, v.stock])));
  const [pending, startTransition] = useTransition();
  const changed = product.variants.filter((v) => values[v.id] !== v.stock);
  return (
    <Modal
      open
      onClose={onClose}
      title="Alterar estoque"
      description={`${product.name} · ${product.sku}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            loading={pending}
            disabled={!changed.length}
            onClick={() =>
              startTransition(async () => {
                for (const v of changed) {
                  const res = await setVariantStockAction(v.id, values[v.id]);
                  if (!res.ok) {
                    toast({ title: res.error, tone: "error" });
                    return;
                  }
                }
                toast({ title: "Estoque atualizado", description: `${changed.length} ${changed.length === 1 ? "variação" : "variações"}`, tone: "success" });
                onSaved();
                onClose();
              })
            }
          >
            Salvar estoque
          </Button>
        </>
      }
    >
      <ul className="divide-y divide-border">
        {product.variants.map((v) => (
          <li key={v.id} className="flex items-center justify-between gap-4 py-2.5">
            <div>
              <p className="text-sm">{[v.color, v.size].filter(Boolean).join(" · ") || "Variação única"}</p>
              <p className="text-xs text-muted-foreground">{v.sku}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Diminuir" onClick={() => setValues((s) => ({ ...s, [v.id]: Math.max(0, s[v.id] - 1) }))}>−</Button>
              <Input type="number" min={0} className="h-8 w-20 text-center" value={values[v.id]} aria-label={`Estoque ${v.sku}`} onChange={(e) => setValues((s) => ({ ...s, [v.id]: Math.max(0, Number(e.target.value) || 0) }))} />
              <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Aumentar" onClick={() => setValues((s) => ({ ...s, [v.id]: s[v.id] + 1 }))}>+</Button>
            </div>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
