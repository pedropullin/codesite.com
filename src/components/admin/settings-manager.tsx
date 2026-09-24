"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition, type ReactNode } from "react";
import type { Banner, StoreSettings } from "@/lib/settings-schema";
import { toast } from "@/lib/client/toast-store";
import { clearDataAction, saveSettingsAction } from "@/app/admin/(panel)/actions";
import { changePasswordAction } from "@/app/admin/auth-actions";
import { SingleImageField } from "./image-uploader";
import { Button, Card, Field, Input, Select, Textarea } from "./ui";
import { cn } from "@/lib/utils";

type ProductOption = { slug: string; name: string };

const TABS = [
  { v: "brand", l: "Marca" },
  { v: "contact", l: "Contato e redes" },
  { v: "hero", l: "Hero" },
  { v: "texts", l: "Textos" },
  { v: "banners", l: "Banners" },
  { v: "featured", l: "Destaques" },
  { v: "account", l: "Conta" },
] as const;

export function SettingsManager({ settings, products }: { settings: StoreSettings; products: ProductOption[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["v"]>("brand");
  return (
    <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
      <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:px-0" aria-label="Seções">
        {TABS.map((t) => (
          <button
            key={t.v}
            type="button"
            onClick={() => setTab(t.v)}
            aria-current={tab === t.v}
            className={cn("shrink-0 rounded-md px-3 py-2 text-left text-sm transition-colors", tab === t.v ? "bg-card font-medium shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-card/60 hover:text-foreground")}
          >
            {t.l}
          </button>
        ))}
      </nav>
      <div>
        {tab === "brand" && <BrandForm initial={settings.brand} />}
        {tab === "contact" && <ContactForm initial={settings.contact} />}
        {tab === "hero" && <HeroForm initial={settings.hero} featured={settings.featured} products={products} />}
        {tab === "texts" && <TextsForm initial={settings.texts} />}
        {tab === "banners" && <BannersForm initial={settings.banners} />}
        {tab === "featured" && <FeaturedForm initial={settings.featured} products={products} />}
        {tab === "account" && <AccountForm />}
      </div>
    </div>
  );
}

function useSave<K extends keyof StoreSettings>(key: K) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = (value: StoreSettings[K]) =>
    start(async () => {
      const res = await saveSettingsAction(key, value);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast({ title: res.error, tone: "error" });
        return;
      }
      setErrors({});
      toast({ title: res.message ?? "Salvo", tone: "success" });
      router.refresh();
    });
  return { save, pending, errors };
}

function Section({ title, description, children, onSave, pending }: { title: string; description?: string; children: ReactNode; onSave?: () => void; pending?: boolean }) {
  return (
    <Card>
      <div className="border-b border-border px-6 py-4">
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="px-6 py-6">{children}</div>
      {onSave && (
        <div className="flex justify-end border-t border-border bg-muted/40 px-6 py-3">
          <Button onClick={onSave} loading={pending}>Salvar alterações</Button>
        </div>
      )}
    </Card>
  );
}

function BrandForm({ initial }: { initial: StoreSettings["brand"] }) {
  const [v, setV] = useState(initial);
  const { save, pending, errors } = useSave("brand");
  const f = (k: keyof typeof v) => ({ value: v[k] ?? "", onChange: (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value }) });
  return (
    <Section title="Marca" description="Nome, logotipo e textos institucionais exibidos na loja." onSave={() => save(v)} pending={pending}>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nome da marca" htmlFor="b-name" error={errors.name}><Input id="b-name" {...f("name")} /></Field>
        <Field label="Nome curto" htmlFor="b-short" error={errors.shortName}><Input id="b-short" {...f("shortName")} /></Field>
        <Field label="Logotipo" hint="Opcional. Sem logo, a loja usa o wordmark tipográfico. Prefira SVG ou PNG claro." className="md:col-span-2">
          <SingleImageField value={v.logoUrl || null} onChange={(url) => setV({ ...v, logoUrl: url ?? "" })} aspect="aspect-[3/1]" maxDim={800} />
        </Field>
        <Field label="Slogan" htmlFor="b-tag" className="md:col-span-2"><Input id="b-tag" {...f("tagline")} /></Field>
        <Field label="Sobre a marca" htmlFor="b-desc" className="md:col-span-2"><Textarea id="b-desc" rows={3} {...f("description")} /></Field>
        <Field label="Manifesto" htmlFor="b-man" hint="Aparece na seção editorial da home" className="md:col-span-2"><Textarea id="b-man" rows={3} {...f("manifesto")} /></Field>
        <Field label="Ano de fundação" htmlFor="b-year"><Input id="b-year" {...f("foundedYear")} /></Field>
        <Field label="Localização" htmlFor="b-loc"><Input id="b-loc" {...f("location")} /></Field>
      </div>
    </Section>
  );
}

function ContactForm({ initial }: { initial: StoreSettings["contact"] }) {
  const [v, setV] = useState(initial);
  const { save, pending, errors } = useSave("contact");
  const f = (k: keyof typeof v) => ({ value: v[k] ?? "", onChange: (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value }) });
  return (
    <Section title="Contato e redes sociais" description="Usados no rodapé, nos botões de WhatsApp e na finalização de pedidos." onSave={() => save({ ...v, whatsapp: v.whatsapp.replace(/\D/g, "") })} pending={pending}>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="WhatsApp (com DDI e DDD)" htmlFor="c-wa" hint="Ex.: 5511999990000 — recebe os pedidos" error={errors.whatsapp}><Input id="c-wa" inputMode="tel" {...f("whatsapp")} /></Field>
        <Field label="E-mail" htmlFor="c-email" error={errors.email}><Input id="c-email" type="email" {...f("email")} /></Field>
        <Field label="Telefone exibido" htmlFor="c-phone"><Input id="c-phone" {...f("phone")} /></Field>
        <Field label="Instagram (usuário)" htmlFor="c-ig"><Input id="c-ig" {...f("instagram")} placeholder="vaultassociation" /></Field>
        <Field label="TikTok (usuário)" htmlFor="c-tt"><Input id="c-tt" {...f("tiktok")} /></Field>
        <Field label="X / Twitter (usuário)" htmlFor="c-x"><Input id="c-x" {...f("x")} /></Field>
        <Field label="YouTube (URL)" htmlFor="c-yt"><Input id="c-yt" {...f("youtube")} placeholder="https://youtube.com/@…" /></Field>
        <Field label="Pinterest (URL)" htmlFor="c-pin"><Input id="c-pin" {...f("pinterest")} /></Field>
        <Field label="Endereço" htmlFor="c-addr" className="md:col-span-2"><Input id="c-addr" {...f("address")} /></Field>
        <Field label="Horário de atendimento" htmlFor="c-hours" className="md:col-span-2"><Input id="c-hours" {...f("hours")} /></Field>
      </div>
    </Section>
  );
}

function HeroForm({ initial, featured, products }: { initial: StoreSettings["hero"]; featured: StoreSettings["featured"]; products: ProductOption[] }) {
  const [v, setV] = useState(initial);
  const [heroSlug, setHeroSlug] = useState(featured.heroProductSlug ?? "");
  const hero = useSave("hero");
  const feat = useSave("featured");
  const f = (k: Exclude<keyof typeof v, "annotations">) => ({ value: v[k], onChange: (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value }) });
  return (
    <Section
      title="Hero 3D"
      description="Textos da abertura da home e o produto que o objeto 3D revela no final do scroll."
      onSave={() => {
        hero.save(v);
        if (heroSlug !== (featured.heroProductSlug ?? "")) feat.save({ ...featured, heroProductSlug: heroSlug });
      }}
      pending={hero.pending || feat.pending}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Texto pequeno" htmlFor="h-eyebrow"><Input id="h-eyebrow" {...f("eyebrow")} /></Field>
        <Field label="Indicador de scroll" htmlFor="h-scroll"><Input id="h-scroll" {...f("scrollLabel")} /></Field>
        <Field label="Título — linha 1" htmlFor="h-t1" error={hero.errors.titleLine1}><Input id="h-t1" {...f("titleLine1")} /></Field>
        <Field label="Título — linha 2" htmlFor="h-t2"><Input id="h-t2" {...f("titleLine2")} /></Field>
        <Field label="Subtexto" htmlFor="h-sub" className="md:col-span-2"><Textarea id="h-sub" rows={2} {...f("subtitle")} /></Field>
        <Field label="CTA principal" htmlFor="h-cta1"><Input id="h-cta1" {...f("ctaPrimary")} /></Field>
        <Field label="CTA secundário" htmlFor="h-cta2"><Input id="h-cta2" {...f("ctaSecondary")} /></Field>
        <div className="md:col-span-2">
          <p className="text-[13px] font-medium">Anotações ao redor do objeto (etapa 2)</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Input key={i} aria-label={`Anotação ${i + 1}`} value={v.annotations[i] ?? ""} onChange={(e) => {
                const a = [...v.annotations];
                a[i] = e.target.value;
                setV({ ...v, annotations: a.filter((x, k) => x || k < 4).slice(0, 4) });
              }} placeholder={`Anotação ${i + 1}`} />
            ))}
          </div>
        </div>
        <Field label="Produto revelado no final do hero" htmlFor="h-prod" hint="O objeto central do 3D se transforma no card deste produto" className="md:col-span-2">
          <Select id="h-prod" value={heroSlug} onChange={(e) => setHeroSlug(e.target.value)}>
            <option value="">Primeiro produto em destaque</option>
            {products.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </Select>
        </Field>
      </div>
    </Section>
  );
}

function TextsForm({ initial }: { initial: StoreSettings["texts"] }) {
  const [v, setV] = useState(initial);
  const { save, pending } = useSave("texts");
  const rows: { k: keyof typeof v; l: string; long?: boolean }[] = [
    { k: "announcement", l: "Barra de anúncio" },
    { k: "brandStatement", l: "Declaração da marca (seção editorial)", long: true },
    { k: "collectionTitle", l: "Título — Collection" },
    { k: "collectionIntro", l: "Introdução — Collection", long: true },
    { k: "categoriesTitle", l: "Título — Categorias" },
    { k: "categoriesIntro", l: "Introdução — Categorias", long: true },
    { k: "featuredLabel", l: "Rótulo — Produto em destaque" },
    { k: "galleryTitle", l: "Título — Galeria" },
    { k: "catalogTitle", l: "Título — Catálogo" },
    { k: "catalogIntro", l: "Introdução — Catálogo", long: true },
    { k: "footerNote", l: "Texto do rodapé", long: true },
    { k: "shippingNote", l: "Aviso de frete (carrinho e checkout)", long: true },
  ];
  return (
    <Section title="Textos do site" description="Títulos e textos editoriais das seções da loja." onSave={() => save(v)} pending={pending}>
      <div className="grid gap-5 md:grid-cols-2">
        {rows.map((r) => (
          <Field key={r.k} label={r.l} htmlFor={`t-${r.k}`} className={r.long ? "md:col-span-2" : undefined}>
            {r.long ? (
              <Textarea id={`t-${r.k}`} rows={2} value={v[r.k]} onChange={(e) => setV({ ...v, [r.k]: e.target.value })} />
            ) : (
              <Input id={`t-${r.k}`} value={v[r.k]} onChange={(e) => setV({ ...v, [r.k]: e.target.value })} />
            )}
          </Field>
        ))}
      </div>
    </Section>
  );
}

function BannersForm({ initial }: { initial: StoreSettings["banners"] }) {
  const [items, setItems] = useState<Banner[]>(initial.items);
  const { save, pending } = useSave("banners");
  const update = (i: number, patch: Partial<Banner>) => setItems(items.map((b, k) => (k === i ? { ...b, ...patch } : b)));
  return (
    <Section title="Banners da galeria" description="Itens da galeria horizontal da home (até 6)." onSave={() => save({ items })} pending={pending}>
      <div className="space-y-6">
        {items.map((b, i) => (
          <div key={i} className="rounded-lg border border-border p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">{String(i + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</p>
              <Button variant="ghost" size="sm" disabled={items.length <= 1} onClick={() => setItems(items.filter((_, k) => k !== i))}><Trash2 /> Remover</Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Título" htmlFor={`bn-t-${i}`}><Input id={`bn-t-${i}`} value={b.title} onChange={(e) => update(i, { title: e.target.value })} /></Field>
              <Field label="Categoria (rótulo)" htmlFor={`bn-c-${i}`}><Input id={`bn-c-${i}`} value={b.category} onChange={(e) => update(i, { category: e.target.value })} /></Field>
              <Field label="Descrição" htmlFor={`bn-d-${i}`} className="md:col-span-2"><Input id={`bn-d-${i}`} value={b.description} onChange={(e) => update(i, { description: e.target.value })} /></Field>
              <Field label="Link" htmlFor={`bn-h-${i}`}><Input id={`bn-h-${i}`} value={b.href} onChange={(e) => update(i, { href: e.target.value })} /></Field>
              <Field label="Texto do botão" htmlFor={`bn-cta-${i}`}><Input id={`bn-cta-${i}`} value={b.cta} onChange={(e) => update(i, { cta: e.target.value })} /></Field>
              <Field label="Imagem (horizontal)" className="md:col-span-2">
                <SingleImageField value={b.image || null} onChange={(url) => update(i, { image: url ?? "" })} aspect="aspect-[16/10]" maxDim={2200} />
              </Field>
            </div>
          </div>
        ))}
        {items.length < 6 && (
          <Button variant="outline" onClick={() => setItems([...items, { title: "Nova linha", category: "", description: "", image: "", href: "/shop", cta: "Explore" }])}>
            <Plus /> Adicionar banner
          </Button>
        )}
      </div>
    </Section>
  );
}

function FeaturedForm({ initial, products }: { initial: StoreSettings["featured"]; products: ProductOption[] }) {
  const [v, setV] = useState(initial);
  const { save, pending } = useSave("featured");
  return (
    <Section title="Destaques" description="Produto da seção de destaque da home e rótulo da coleção atual. Para destacar produtos na seção The Collection, use a estrela na lista de produtos." onSave={() => save(v)} pending={pending}>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Produto em destaque" htmlFor="f-prod">
          <Select id="f-prod" value={v.productSlug} onChange={(e) => setV({ ...v, productSlug: e.target.value })}>
            <option value="">Primeiro produto marcado como destaque</option>
            {products.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Rótulo da coleção" htmlFor="f-label"><Input id="f-label" value={v.collectionLabel} onChange={(e) => setV({ ...v, collectionLabel: e.target.value })} /></Field>
        <Field label="Imagem da seção de destaque" hint="Opcional — PNG/WebP com fundo transparente funciona melhor. Vazio usa a foto do produto." className="md:col-span-2">
          <SingleImageField value={v.image || null} onChange={(url) => setV({ ...v, image: url ?? "" })} aspect="aspect-[3/2]" maxDim={2400} />
        </Field>
      </div>
    </Section>
  );
}

function AccountForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);
  const [confirm, setConfirm] = useState("");
  const [clearing, startClear] = useTransition();
  const router = useRouter();
  return (
    <div className="space-y-6">
      <Section title="Alterar senha" description="Use uma senha forte, com ao menos 8 caracteres.">
        <form action={action} className="grid max-w-md gap-4">
          <Field label="Senha atual" htmlFor="a-cur"><Input id="a-cur" name="current" type="password" autoComplete="current-password" required /></Field>
          <Field label="Nova senha" htmlFor="a-new"><Input id="a-new" name="password" type="password" autoComplete="new-password" minLength={8} required /></Field>
          <Field label="Confirmar nova senha" htmlFor="a-conf"><Input id="a-conf" name="confirm" type="password" autoComplete="new-password" minLength={8} required /></Field>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state?.success && <p className="text-sm text-emerald-700">{state.success}</p>}
          <div><Button type="submit" loading={pending}>Alterar senha</Button></div>
        </form>
      </Section>
      <Section title="Zona de perigo" description="Remove todos os pedidos, clientes e eventos de analytics (por exemplo, os dados de demonstração). Produtos, categorias e configurações são mantidos.">
        <div className="flex max-w-md flex-col gap-3 sm:flex-row">
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder='Digite "LIMPAR" para confirmar' aria-label="Confirmação" />
          <Button
            variant="danger"
            disabled={confirm !== "LIMPAR"}
            loading={clearing}
            onClick={() =>
              startClear(async () => {
                const res = await clearDataAction(confirm);
                toast({ title: res.ok ? res.message ?? "Dados removidos" : res.error, tone: res.ok ? "success" : "error" });
                setConfirm("");
                router.refresh();
              })
            }
          >
            Limpar dados
          </Button>
        </div>
      </Section>
    </div>
  );
}
