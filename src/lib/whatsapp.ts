import { formatCep, formatPhone, formatPrice } from "./format";

export type WhatsAppOrder = {
  number: number;
  brand: string;
  customer: { name: string; email: string; phone: string };
  address: {
    cep: string;
    address: string;
    number: string;
    complement?: string | null;
    district?: string | null;
    city: string;
    state: string;
  };
  items: { name: string; size: string | null; color: string | null; quantity: number; unitPrice: number; lineTotal: number; sku: string }[];
  subtotal: number;
  shipping: number;
  total: number;
  notes?: string | null;
  shippingNote?: string;
};

/** Builds the organised order message sent to the store's WhatsApp. */
export function buildOrderMessage(o: WhatsAppOrder) {
  const lines: string[] = [];
  lines.push(`*${o.brand.toUpperCase()} — PEDIDO #${o.number}*`);
  lines.push("");
  lines.push("*Cliente*");
  lines.push(`Nome: ${o.customer.name}`);
  lines.push(`E-mail: ${o.customer.email}`);
  lines.push(`Telefone: ${formatPhone(o.customer.phone)}`);
  lines.push("");
  lines.push("*Itens*");
  o.items.forEach((it, i) => {
    const variant = [it.color, it.size].filter(Boolean).join(" / ");
    lines.push(`${i + 1}. ${it.name}${variant ? ` — ${variant}` : ""}`);
    lines.push(`   SKU ${it.sku} · ${it.quantity} × ${formatPrice(it.unitPrice)} = ${formatPrice(it.lineTotal)}`);
  });
  lines.push("");
  lines.push(`Subtotal: ${formatPrice(o.subtotal)}`);
  lines.push(`Frete: ${o.shipping > 0 ? formatPrice(o.shipping) : "a combinar"}`);
  lines.push(`*Total: ${formatPrice(o.total)}*`);
  lines.push("");
  lines.push("*Entrega*");
  const street = [o.address.address, o.address.number].filter(Boolean).join(", ");
  lines.push(`${street}${o.address.complement ? ` — ${o.address.complement}` : ""}`);
  if (o.address.district) lines.push(o.address.district);
  lines.push(`${o.address.city}/${o.address.state} — CEP ${formatCep(o.address.cep)}`);
  if (o.notes) {
    lines.push("");
    lines.push("*Observações*");
    lines.push(o.notes);
  }
  if (o.shippingNote) {
    lines.push("");
    lines.push(`_${o.shippingNote}_`);
  }
  return lines.join("\n");
}

export function buildProductMessage(p: { name: string; price: string; url: string; size?: string | null; color?: string | null }) {
  const variant = [p.color, p.size].filter(Boolean).join(" / ");
  return [
    "Olá! Tenho interesse nesta peça da Vault Association:",
    "",
    `*${p.name}*${variant ? ` — ${variant}` : ""}`,
    p.price,
    p.url,
  ].join("\n");
}
