import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
  blob,
} from "drizzle-orm/sqlite-core";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`);

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`);

export type ProductColor = { name: string; hex: string; image?: string };

export const ORDER_STATUSES = [
  "NOVO",
  "AGUARDANDO_PAGAMENTO",
  "PAGO",
  "EM_PREPARACAO",
  "ENVIADO",
  "ENTREGUE",
  "CANCELADO",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ANALYTICS_EVENT_TYPES = [
  "page_view",
  "product_view",
  "add_to_cart",
  "checkout_start",
  "purchase",
] as const;
export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

/* ------------------------------------------------------------------ */
/* USERS — admin accounts                                              */
/* ------------------------------------------------------------------ */

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: ["owner", "admin", "staff"] })
      .notNull()
      .default("admin"),
    resetTokenHash: text("reset_token_hash"),
    resetTokenExpiresAt: integer("reset_token_expires_at", {
      mode: "timestamp_ms",
    }),
    lastLoginAt: integer("last_login_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

/* ------------------------------------------------------------------ */
/* CATEGORIES                                                          */
/* ------------------------------------------------------------------ */

export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull().default(""),
    image: text("image"),
    sortOrder: integer("sort_order").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("categories_slug_idx").on(t.slug)],
);

/* ------------------------------------------------------------------ */
/* PRODUCTS                                                            */
/* ------------------------------------------------------------------ */

export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    sku: text("sku").notNull(),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    /** Prices are stored in cents (BRL). */
    price: integer("price").notNull(),
    salePrice: integer("sale_price"),
    description: text("description").notNull().default(""),
    details: text("details", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    images: text("images", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    sizes: text("sizes", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    colors: text("colors", { mode: "json" })
      .$type<ProductColor[]>()
      .notNull()
      .default(sql`'[]'`),
    /** Optional editorial label, e.g. "EDITION 001/250". */
    label: text("label"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    isNew: integer("is_new", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("products_slug_idx").on(t.slug),
    uniqueIndex("products_sku_idx").on(t.sku),
    index("products_category_idx").on(t.categoryId),
    index("products_active_idx").on(t.active),
  ],
);

/* ------------------------------------------------------------------ */
/* PRODUCT_VARIANTS — size × color combinations with their own stock   */
/* ------------------------------------------------------------------ */

export const productVariants = sqliteTable(
  "product_variants",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull(),
    size: text("size"),
    color: text("color"),
    stock: integer("stock").notNull().default(0),
    /** Optional price override in cents. */
    price: integer("price"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("variants_product_idx").on(t.productId),
    uniqueIndex("variants_sku_idx").on(t.sku),
  ],
);

/* ------------------------------------------------------------------ */
/* CUSTOMERS                                                           */
/* ------------------------------------------------------------------ */

export const customers = sqliteTable(
  "customers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    cep: text("cep"),
    address: text("address"),
    number: text("number"),
    complement: text("complement"),
    district: text("district"),
    city: text("city"),
    state: text("state"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("customers_email_idx").on(t.email)],
);

/* ------------------------------------------------------------------ */
/* ORDERS                                                              */
/* ------------------------------------------------------------------ */

export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Human-facing sequential number, e.g. 1042. */
    number: integer("number").notNull(),
    /** Random token so customers can view their own confirmation page. */
    accessToken: text("access_token").notNull(),
    customerId: integer("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    status: text("status", { enum: ORDER_STATUSES }).notNull().default("NOVO"),
    channel: text("channel", { enum: ["site", "whatsapp"] })
      .notNull()
      .default("site"),
    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull().default(0),
    shipping: integer("shipping").notNull().default(0),
    total: integer("total").notNull(),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),
    cep: text("cep").notNull(),
    address: text("address").notNull(),
    addressNumber: text("address_number").notNull(),
    complement: text("complement"),
    district: text("district"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("orders_number_idx").on(t.number),
    index("orders_customer_idx").on(t.customerId),
    index("orders_created_idx").on(t.createdAt),
    index("orders_status_idx").on(t.status),
  ],
);

/* ------------------------------------------------------------------ */
/* ORDER_ITEMS — snapshot of what was purchased                         */
/* ------------------------------------------------------------------ */

export const orderItems = sqliteTable(
  "order_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    variantId: integer("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    productName: text("product_name").notNull(),
    sku: text("sku").notNull(),
    size: text("size"),
    color: text("color"),
    image: text("image"),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: integer("line_total").notNull(),
  },
  (t) => [
    index("order_items_order_idx").on(t.orderId),
    index("order_items_product_idx").on(t.productId),
  ],
);

/* ------------------------------------------------------------------ */
/* ORDER_STATUS_HISTORY — timeline of status changes                   */
/* ------------------------------------------------------------------ */

export const orderStatusHistory = sqliteTable(
  "order_status_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: text("status", { enum: ORDER_STATUSES }).notNull(),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [index("order_history_order_idx").on(t.orderId)],
);

/* ------------------------------------------------------------------ */
/* ANALYTICS — raw events produced by real platform activity           */
/* ------------------------------------------------------------------ */

export const analyticsEvents = sqliteTable(
  "analytics_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    type: text("type", { enum: ANALYTICS_EVENT_TYPES }).notNull(),
    sessionId: text("session_id").notNull(),
    path: text("path"),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    orderId: integer("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    value: integer("value"),
    createdAt: createdAt(),
  },
  (t) => [
    index("analytics_type_created_idx").on(t.type, t.createdAt),
    index("analytics_product_idx").on(t.productId),
  ],
);

/* ------------------------------------------------------------------ */
/* STORE_SETTINGS — key/value JSON documents                           */
/* ------------------------------------------------------------------ */

export const storeSettings = sqliteTable(
  "store_settings",
  {
    key: text("key").notNull(),
    value: text("value", { mode: "json" }).notNull(),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.key] })],
);

/* ------------------------------------------------------------------ */
/* MEDIA — uploaded images (compressed client-side), served at /media  */
/* ------------------------------------------------------------------ */

export const media = sqliteTable("media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mime: text("mime").notNull(),
  width: integer("width"),
  height: integer("height"),
  size: integer("size").notNull(),
  data: blob("data", { mode: "buffer" }).notNull(),
  createdAt: createdAt(),
});

/* ------------------------------------------------------------------ */
/* Relations                                                           */
/* ------------------------------------------------------------------ */

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
  orderItems: many(orderItems),
}));

export const productVariantsRelations = relations(
  productVariants,
  ({ one }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
  }),
);

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  history: many(orderStatusHistory),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const orderStatusHistoryRelations = relations(
  orderStatusHistory,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderStatusHistory.orderId],
      references: [orders.id],
    }),
  }),
);

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
