"use client";

import { ChevronLeft, ChevronRight, ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "@/lib/client/toast-store";
import { Button, Input, Spinner } from "./ui";
import { cn } from "@/lib/utils";

/** Resizes to max `maxDim` px and re-encodes as WebP (keeps uploads small). */
export async function compressImage(file: File, maxDim = 1800, quality = 0.86): Promise<{ blob: Blob; width: number; height: number }> {
  if (file.type === "image/svg+xml") return { blob: file, width: 0, height: 0 };
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/webp", quality));
  return { blob, width, height };
}

export async function uploadImage(file: File, maxDim?: number) {
  const { blob, width, height } = await compressImage(file, maxDim);
  const fd = new FormData();
  fd.append("file", new File([blob], file.name.replace(/\.\w+$/, blob.type === "image/webp" ? ".webp" : ""), { type: blob.type }));
  fd.append("width", String(width));
  fd.append("height", String(height));
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Falha no upload");
  return data.url as string;
}

/** Multi-image manager: upload, reorder, remove, add by URL. First image is the cover. */
export function ImageListEditor({ value, onChange, max = 12 }: { value: string[]; onChange: (v: string[]) => void; max?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [url, setUrl] = useState("");
  const [drag, setDrag] = useState(false);

  const addFiles = async (files: FileList | File[]) => {
    const list = [...files].filter((f) => f.type.startsWith("image/")).slice(0, max - value.length);
    if (!list.length) return;
    setBusy((b) => b + list.length);
    const urls: string[] = [];
    for (const f of list) {
      try {
        urls.push(await uploadImage(f));
      } catch (e) {
        toast({ title: "Falha no upload", description: e instanceof Error ? e.message : String(e), tone: "error" });
      } finally {
        setBusy((b) => b - 1);
      }
    }
    if (urls.length) onChange([...value, ...urls]);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div
        className={cn("grid grid-cols-3 gap-3 sm:grid-cols-4", drag && "rounded-lg ring-2 ring-foreground/30")}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        {value.map((src, i) => (
          <div key={src + i} className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-[#ecebe6]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-contain p-1" />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background">Capa</span>}
            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <div className="flex gap-1">
                <button type="button" aria-label="Mover para a esquerda" onClick={() => move(i, -1)} className="rounded bg-white/90 p-1 shadow disabled:opacity-40" disabled={i === 0}><ChevronLeft className="h-3.5 w-3.5" /></button>
                <button type="button" aria-label="Mover para a direita" onClick={() => move(i, 1)} className="rounded bg-white/90 p-1 shadow disabled:opacity-40" disabled={i === value.length - 1}><ChevronRight className="h-3.5 w-3.5" /></button>
              </div>
              <button type="button" aria-label="Remover imagem" onClick={() => onChange(value.filter((_, k) => k !== i))} className="rounded bg-white/90 p-1 text-red-600 shadow"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
        {Array.from({ length: busy }).map((_, i) => (
          <div key={`busy-${i}`} className="flex aspect-[4/5] items-center justify-center rounded-lg border border-dashed border-border bg-muted"><Spinner /></div>
        ))}
        {value.length + busy < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            <ImagePlus className="h-5 w-5" />
            Enviar imagens
            <span className="text-[10px] opacity-70">ou arraste aqui</span>
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
      <div className="flex gap-2">
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…ou cole a URL de uma imagem (https:// ou /renders/…)" className="h-9 text-xs" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => {
            const v = url.trim();
            if (!v) return;
            if (!v.startsWith("/") && !v.startsWith("https://")) {
              toast({ title: "URL inválida", description: "Use https:// ou um caminho iniciado por /", tone: "error" });
              return;
            }
            onChange([...value, v]);
            setUrl("");
          }}
        >
          Adicionar
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">As imagens são redimensionadas e convertidas para WebP antes do envio. A primeira é a capa do produto.</p>
    </div>
  );
}

/** Single image field (categories, logo, banners). */
export function SingleImageField({ value, onChange, aspect = "aspect-[4/3]", maxDim = 2000 }: { value: string | null; onChange: (v: string | null) => void; aspect?: string; maxDim?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-start gap-4">
      <div className={cn("relative w-40 shrink-0 overflow-hidden rounded-lg border border-border bg-[#ecebe6]", aspect)}>
        {busy ? (
          <div className="flex h-full items-center justify-center"><Spinner /></div>
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] text-muted-foreground">Sem imagem</div>
        )}
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()} disabled={busy}>
            <ImagePlus /> Enviar
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              Remover
            </Button>
          )}
        </div>
        <Input value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} placeholder="/renders/… ou https://…" className="h-9 text-xs" />
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          try {
            onChange(await uploadImage(f, maxDim));
          } catch (err) {
            toast({ title: "Falha no upload", description: err instanceof Error ? err.message : String(err), tone: "error" });
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
}
