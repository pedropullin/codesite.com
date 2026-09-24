import type { OrderStatus, ProductColor } from "@/db/schema";

export type ProductStatusCode = "sold-out" | "last-units" | "new" | "limited" | "available";

export type ProductCardData = {
  id: number;
  slug: string;
  name: string;
  sku: string;
  price: number;
  salePrice: number | null;
  /** Price actually charged (sale price if set). */
  effectivePrice: number;
  image: string | null;
  images: string[];
  category: { name: string; slug: string } | null;
  stock: number;
  status: { code: ProductStatusCode; label: string };
  label: string | null;
  isNew: boolean;
  featured: boolean;
  colors: ProductColor[];
  sizes: string[];
  createdAt: number;
};

export type VariantData = {
  id: number;
  sku: string;
  size: string | null;
  color: string | null;
  stock: number;
  price: number | null;
};

export type ProductDetail = ProductCardData & {
  description: string;
  details: string[];
  variants: VariantData[];
};

export type CartItem = {
  key: string;
  productId: number;
  variantId: number;
  slug: string;
  name: string;
  image: string | null;
  size: string | null;
  color: string | null;
  unitPrice: number;
  quantity: number;
  maxStock: number;
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  NOVO: "Novo",
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGO: "Pago",
  EM_PREPARACAO: "Em preparação",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export type { OrderStatus, ProductColor };
