import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";
import { getDb, schema } from "@/db";
import { AdminSidebar } from "@/components/admin/sidebar";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  const db = await getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(schema.orders).where(eq(schema.orders.status, "NOVO"));
  return (
    <div className="min-h-dvh bg-[#f5f5f3]">
      <AdminSidebar user={user} newOrders={Number(n)} />
      <div className="lg:pl-60">
        <main className="mx-auto max-w-[1400px] px-4 pb-20 pt-6 md:px-8 md:pt-10">{children}</main>
      </div>
    </div>
  );
}
