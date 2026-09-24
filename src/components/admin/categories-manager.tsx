"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { slugify } from "@/lib/format";
import { toast } from "@/lib/client/toast-store";
import { deleteCategoryAction, saveCategoryAction } from "@/app/admin/(panel)/actions";
import { SingleImageField } from "./image-uploader";
import { ConfirmDialog, Modal } from "./modal";
import { Badge, Button, Card, EmptyState, Field, Input, Switch, Textarea } from "./ui";

type Category = { id: number; name: string; slug: string; description: string; image: string | null; sortOrder: number; active: boolean; productCount: number };
type Draft = Omit<Category, "id" | "productCount"> & { id?: number };

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = () => {
    if (!editing) return;
    startTransition(async () => {
      const res = await saveCategoryAction(editing);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast({ title: res.error, tone: "error" });
        return;
      }
      toast({ title: res.message ?? "Salvo", tone: "success" });
      setEditing(null);
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => { setErrors({}); setEditing({ name: "", slug: "", description: "", image: null, active: true, sortOrder: categories.length }); }}>
          <Plus /> Nova categoria
        </Button>
      </div>
      {categories.length === 0 ? (
        <Card><EmptyState title="Nenhuma categoria" description="Crie categorias para organizar o catálogo e a home." /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <div className="relative aspect-[4/3] bg-neutral-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.image && <img src={c.image} alt="" className="h-full w-full object-cover opacity-90" />}
                <div className="absolute left-3 top-3 flex gap-1.5">
                  <Badge tone="dark">#{c.sortOrder + 1}</Badge>
                  {!c.active && <Badge tone="warning">Oculta</Badge>}
                </div>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">/{c.slug} · {c.productCount} {c.productCount === 1 ? "produto ativo" : "produtos ativos"}</p>
                </div>
                <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">{c.description || "Sem descrição"}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setErrors({}); setEditing({ ...c }); }}><Pencil /> Editar</Button>
                  <Button variant="ghost" size="sm" aria-label={`Excluir ${c.name}`} onClick={() => setDeleting(c)}><Trash2 /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Editar categoria" : "Nova categoria"}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} loading={pending}>Salvar</Button>
          </>
        }
      >
        {editing && (
          <div className="grid gap-5">
            <Field label="Nome" htmlFor="c-name" error={errors.name}>
              <Input id="c-name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} />
            </Field>
            <Field label="Slug" htmlFor="c-slug" hint={`/shop?category=${editing.slug || "…"}`}>
              <Input id="c-slug" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} />
            </Field>
            <Field label="Descrição" htmlFor="c-desc">
              <Textarea id="c-desc" rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </Field>
            <Field label="Imagem (vertical, usada na home)">
              <SingleImageField value={editing.image} onChange={(v) => setEditing({ ...editing, image: v })} aspect="aspect-[3/4]" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ordem" htmlFor="c-order">
                <Input id="c-order" type="number" min={0} value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Math.max(0, Number(e.target.value) || 0) })} />
              </Field>
              <label className="flex items-end justify-between gap-3 pb-2">
                <span className="text-sm font-medium">Visível na loja</span>
                <Switch checked={editing.active} onChange={(v) => setEditing({ ...editing, active: v })} label="Visível na loja" />
              </label>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        danger
        loading={pending}
        title={`Excluir “${deleting?.name}”?`}
        description="Os produtos desta categoria continuarão existindo, porém sem categoria."
        confirmLabel="Excluir"
        onConfirm={() =>
          startTransition(async () => {
            if (!deleting) return;
            const res = await deleteCategoryAction(deleting.id);
            toast({ title: res.ok ? res.message ?? "Excluída" : res.error, tone: res.ok ? "success" : "error" });
            setDeleting(null);
            router.refresh();
          })
        }
      />
    </>
  );
}
