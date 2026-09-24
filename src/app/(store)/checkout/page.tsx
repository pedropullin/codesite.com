import type { Metadata } from "next";
import { ViewTransition } from "react";
import { getSettings } from "@/lib/data/settings";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const settings = await getSettings();
  return (
    <ViewTransition enter="page-fade" exit="page-fade" default="none">
      <div className="min-h-dvh bg-paper text-ink">
        <div className="mx-auto max-w-[1400px] px-5 pb-28 pt-28 md:px-10 md:pt-36">
          <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="label text-ink/50">Checkout — Secure order</p>
              <h1 className="display-lg mt-4">Finalize your order</h1>
            </div>
            <ol className="label-sm flex gap-6 text-ink/45">
              <li className="text-ink">01 Dados</li>
              <li>02 Confirmação</li>
              <li>03 Concierge</li>
            </ol>
          </div>
          <CheckoutForm shippingNote={settings.texts.shippingNote} />
        </div>
      </div>
    </ViewTransition>
  );
}
