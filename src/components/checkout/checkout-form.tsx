"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { cart, useCart } from "@/lib/client/cart-store";
import { getSessionId } from "@/lib/client/analytics";
import { toast } from "@/lib/client/toast-store";
import { formatPrice, onlyDigits } from "@/lib/format";
import { placeOrderAction, refreshCartAction } from "@/app/(store)/checkout/actions";
import { VaultButton, VaultLink } from "@/components/store/vault-button";
import { WhatsAppIcon } from "@/components/product/product-view";
import { cn } from "@/lib/utils";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

type Fields = {
  name: string; email: string; phone: string; cep: string; address: string; number: string;
  complement: string; district: string; city: string; state: string; notes: string;
};

const EMPTY: Fields = { name: "", email: "", phone: "", cep: "", address: "", number: "", complement: "", district: "", city: "", state: "", notes: "" };
const DRAFT_KEY = "vault-checkout-draft";

function maskPhone(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function maskCep(v: string) {
  const d = onlyDigits(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

function validate(f: Fields) {
  const e: Partial<Record<keyof Fields, string>> = {};
  if (f.name.trim().length < 3) e.name = "Informe seu nome completo";
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "E-mail inválido";
  if (onlyDigits(f.phone).length < 10) e.phone = "Telefone inválido";
  if (onlyDigits(f.cep).length !== 8) e.cep = "CEP inválido";
  if (f.address.trim().length < 3) e.address = "Informe o endereço";
  if (!f.number.trim()) e.number = "Informe o número";
  if (f.city.trim().length < 2) e.city = "Informe a cidade";
  if (!UFS.includes(f.state)) e.state = "Selecione o estado";
  return e;
}

export function CheckoutForm({ shippingNote }: { shippingNote: string }) {
  const router = useRouter();
  const { items, subtotal, hydrated } = useCart();
  const [fields, setFields] = useState<Fields>(() => {
    if (typeof window === "undefined") return EMPTY;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
    } catch {
      return EMPTY;
    }
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [formError, setFormError] = useState<{ message: string; details?: string[] } | null>(null);
  const [cepState, setCepState] = useState<"idle" | "loading" | "found" | "error">("idle");
  const [pending, startTransition] = useTransition();
  const [channel, setChannel] = useState<"site" | "whatsapp" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const numberRef = useRef<HTMLInputElement>(null);
  const refreshed = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...fields, notes: "" }));
    } catch {
      /* ignore */
    }
  }, [fields]);

  // Sync the cart with live stock & prices once.
  useEffect(() => {
    if (!hydrated || refreshed.current || items.length === 0) return;
    refreshed.current = true;
    refreshCartAction(items.map((i) => i.variantId)).then((live) => {
      const map = new Map(live.map((l) => [l.variantId, l]));
      let changed = false;
      const next = items
        .map((it) => {
          const l = map.get(it.variantId);
          if (!l || !l.available || l.stock <= 0) {
            changed = true;
            return null;
          }
          const quantity = Math.min(it.quantity, l.stock);
          if (quantity !== it.quantity || l.unitPrice !== it.unitPrice || l.stock !== it.maxStock) changed = changed || quantity !== it.quantity || l.unitPrice !== it.unitPrice;
          return { ...it, quantity, unitPrice: l.unitPrice, maxStock: l.stock };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
      cart.replace(next);
      if (changed) setNotice("Atualizamos seu carrinho com o estoque e os preços atuais.");
    });
  }, [hydrated, items]);

  const set = (k: keyof Fields, v: string) => {
    setFields((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const lookupCep = async (raw: string) => {
    const cep = onlyDigits(raw);
    if (cep.length !== 8) return;
    setCepState("loading");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) throw new Error("not found");
      setFields((f) => ({
        ...f,
        address: data.logradouro || f.address,
        district: data.bairro || f.district,
        city: data.localidade || f.city,
        state: data.uf || f.state,
      }));
      setCepState("found");
      setTimeout(() => numberRef.current?.focus(), 50);
    } catch {
      setCepState("error");
    }
  };

  const submit = (via: "site" | "whatsapp") => {
    const e = validate(fields);
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      document.getElementById(`field-${first}`)?.focus();
      setFormError({ message: "Revise os campos destacados." });
      return;
    }
    // Open the WhatsApp tab synchronously (inside the click) to avoid popup blockers.
    const popup = via === "whatsapp" ? window.open("about:blank", "_blank") : null;
    setChannel(via);
    startTransition(async () => {
      const result = await placeOrderAction({
        ...fields,
        channel: via,
        sessionId: getSessionId(),
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      });
      if (!result.ok) {
        popup?.close();
        setChannel(null);
        if (result.fieldErrors) setErrors(result.fieldErrors as typeof errors);
        setFormError({ message: result.error, details: result.details });
        toast({ title: "Pedido não finalizado", description: result.error, tone: "error" });
        refreshed.current = false;
        return;
      }
      if (popup) popup.location.href = result.whatsappUrl;
      cart.clear();
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      router.push(`/checkout/success/${result.number}?t=${result.token}${via === "whatsapp" && !popup ? "&wa=1" : ""}`);
    });
  };

  if (!hydrated) {
    return <div className="skeleton h-[60vh] w-full" />;
  }

  if (items.length === 0 && !pending) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-32 text-center">
        <p className="display-lg">Your vault is empty</p>
        <p className="max-w-sm text-sm text-ink/60">Adicione peças ao carrinho para finalizar um pedido.</p>
        <VaultLink href="/shop" variant="solid-dark" arrow>Explore the collection</VaultLink>
      </div>
    );
  }

  return (
    <form
      className="grid gap-12 lg:grid-cols-12 lg:gap-10"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit("site");
      }}
    >
      <div className="space-y-14 lg:col-span-7">
        {notice && <p className="border border-ink/15 bg-bone-2 px-4 py-3 text-sm">{notice}</p>}
        <Section index="01" title="Contato">
          <div className="grid gap-6 md:grid-cols-2">
            <Field id="name" label="Nome completo" value={fields.name} error={errors.name} onChange={(v) => set("name", v)} autoComplete="name" className="md:col-span-2" />
            <Field id="email" label="E-mail" type="email" value={fields.email} error={errors.email} onChange={(v) => set("email", v)} autoComplete="email" inputMode="email" />
            <Field id="phone" label="Telefone / WhatsApp" value={fields.phone} error={errors.phone} onChange={(v) => set("phone", maskPhone(v))} autoComplete="tel" inputMode="tel" placeholder="(11) 99999-9999" />
          </div>
        </Section>
        <Section index="02" title="Entrega">
          <div className="grid gap-6 md:grid-cols-6">
            <Field
              id="cep"
              label="CEP"
              value={fields.cep}
              error={errors.cep}
              onChange={(v) => {
                const m = maskCep(v);
                set("cep", m);
                if (onlyDigits(m).length === 8) lookupCep(m);
              }}
              autoComplete="postal-code"
              inputMode="numeric"
              placeholder="00000-000"
              className="md:col-span-2"
              hint={cepState === "loading" ? "Buscando endereço…" : cepState === "found" ? "Endereço encontrado" : cepState === "error" ? "CEP não encontrado — preencha manualmente" : undefined}
            />
            <Field id="address" label="Endereço" value={fields.address} error={errors.address} onChange={(v) => set("address", v)} autoComplete="address-line1" className="md:col-span-4" />
            <Field id="number" inputRef={numberRef} label="Número" value={fields.number} error={errors.number} onChange={(v) => set("number", v)} className="md:col-span-2" />
            <Field id="complement" label="Complemento" value={fields.complement} onChange={(v) => set("complement", v)} autoComplete="address-line2" optional className="md:col-span-4" />
            <Field id="district" label="Bairro" value={fields.district} onChange={(v) => set("district", v)} optional className="md:col-span-2" />
            <Field id="city" label="Cidade" value={fields.city} error={errors.city} onChange={(v) => set("city", v)} autoComplete="address-level2" className="md:col-span-3" />
            <div className="md:col-span-1">
              <label htmlFor="field-state" className="label-sm text-ink/55">Estado</label>
              <select
                id="field-state"
                value={fields.state}
                onChange={(e) => set("state", e.target.value)}
                aria-invalid={!!errors.state}
                className={cn("mt-2 h-11 w-full border-0 border-b bg-transparent text-base outline-none transition-colors focus:border-ink", errors.state ? "border-red-600" : "border-ink/20")}
              >
                <option value="">UF</option>
                {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              {errors.state && <p className="mt-2 text-xs text-red-600">{errors.state}</p>}
            </div>
          </div>
        </Section>
        <Section index="03" title="Observações">
          <label htmlFor="field-notes" className="label-sm text-ink/55">Observações sobre o pedido <span className="text-ink/35">(opcional)</span></label>
          <textarea
            id="field-notes"
            rows={3}
            value={fields.notes}
            maxLength={600}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Presente, horário de entrega, embalagem…"
            className="mt-2 w-full resize-none border-0 border-b border-ink/20 bg-transparent py-2 text-base outline-none placeholder:text-ink/30 focus:border-ink"
          />
        </Section>
      </div>

      <aside className="lg:col-span-5">
        <div className="bg-ink p-6 text-bone md:p-8 lg:sticky lg:top-28">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-sm uppercase tracking-[0.2em]">Resumo</p>
            <p className="label-sm text-steel">{items.reduce((a, i) => a + i.quantity, 0)} itens</p>
          </div>
          <ul className="mt-6 max-h-[42vh] divide-y divide-white/10 overflow-y-auto pr-1" data-lenis-prevent>
            {items.map((it) => (
              <li key={it.key} className="flex gap-4 py-4">
                <div className="relative h-20 w-16 shrink-0 bg-bone-3">
                  {it.image && <Image src={it.image} alt={it.name} fill sizes="64px" className="object-contain p-1" />}
                  <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-bone px-1 text-[10px] text-ink">{it.quantity}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs uppercase tracking-[0.08em]">{it.name}</p>
                  <p className="label-sm mt-1 text-steel">{[it.color, it.size].filter(Boolean).join(" · ")}</p>
                  <p className="label-sm mt-1 text-steel">{it.quantity} × {formatPrice(it.unitPrice)}</p>
                </div>
                <p className="text-sm tabular-nums">{formatPrice(it.unitPrice * it.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-white/10 pt-5 text-sm">
            <div className="flex justify-between text-steel"><dt>Subtotal</dt><dd className="tabular-nums">{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between text-steel"><dt>Frete</dt><dd>A combinar</dd></div>
            <div className="flex justify-between pt-3 text-lg"><dt className="uppercase tracking-[0.1em]">Total</dt><dd className="tabular-nums">{formatPrice(subtotal)}</dd></div>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-steel">{shippingNote}</p>

          {formError && (
            <div role="alert" className="mt-5 border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              <p>{formError.message}</p>
              {formError.details?.length ? (
                <ul className="mt-2 list-disc pl-5 text-xs text-red-100/80">
                  {formError.details.map((d) => <li key={d}>{d}</li>)}
                </ul>
              ) : null}
            </div>
          )}

          <div className="mt-6 grid gap-3">
            <VaultButton type="submit" variant="solid" arrow className="w-full" disabled={pending}>
              {pending && channel === "site" ? "Registrando pedido…" : "Finalizar pedido"}
            </VaultButton>
            <VaultButton type="button" variant="outline" className="w-full" disabled={pending} onClick={() => submit("whatsapp")}>
              <WhatsAppIcon />
              {pending && channel === "whatsapp" ? "Abrindo WhatsApp…" : "Finalizar via WhatsApp"}
            </VaultButton>
            <Link href="/shop" className="label mt-2 text-center text-steel hover:text-bone">Continuar comprando</Link>
          </div>
          <p className="mt-6 text-[11px] leading-relaxed text-steel">
            Ao finalizar, seu pedido é registrado e nossa equipe confirma pagamento, frete e prazo pelo WhatsApp informado.
          </p>
        </div>
      </aside>
    </form>
  );
}

function Section({ index, title, children }: { index: string; title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-8 flex w-full items-baseline gap-4 border-b border-ink/10 pb-4">
        <span className="label-sm text-ink/40">{index}</span>
        <span className="font-display text-sm uppercase tracking-[0.2em]">{title}</span>
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  id, label, value, onChange, error, type = "text", autoComplete, inputMode, placeholder, className, optional, hint, inputRef,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; error?: string; type?: string;
  autoComplete?: string; inputMode?: "text" | "email" | "tel" | "numeric"; placeholder?: string; className?: string;
  optional?: boolean; hint?: string; inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <div className={className}>
      <label htmlFor={`field-${id}`} className="label-sm text-ink/55">
        {label} {optional && <span className="text-ink/35">(opcional)</span>}
      </label>
      <input
        ref={inputRef}
        id={`field-${id}`}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `err-${id}` : undefined}
        className={cn(
          "mt-2 h-11 w-full border-0 border-b bg-transparent text-base outline-none transition-colors placeholder:text-ink/25 focus:border-ink",
          error ? "border-red-600" : "border-ink/20",
        )}
      />
      {error ? <p id={`err-${id}`} className="mt-2 text-xs text-red-600">{error}</p> : hint ? <p className="mt-2 text-xs text-ink/50">{hint}</p> : null}
    </div>
  );
}
