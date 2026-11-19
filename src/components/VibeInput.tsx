"use client";

import { useState } from "react";
import { MailIcon } from "./icons";
import { mailtoLink, whatsappLink } from "@/lib/site";

const KINDS = ["Site", "Landing page", "Loja virtual", "Sistema", "3D"];

/** The hero's command center: describe the project and send it straight to WhatsApp. */
export default function VibeInput() {
  const [text, setText] = useState("");
  const [kind, setKind] = useState<string | null>(null);

  const message = () =>
    [
      "Olá! Vim pelo site da CODE SITE.",
      kind ? `Quero: ${kind}.` : "",
      text.trim(),
    ]
      .filter(Boolean)
      .join("\n");

  const send = () => window.open(whatsappLink(message()), "_blank", "noopener,noreferrer");

  return (
    <form
      className="group/vibe relative w-full max-w-3xl text-left"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <div className="glow-under pointer-events-none absolute -inset-1 rounded-[1.4rem]" aria-hidden />
      <div className="relative rounded-2xl bg-white p-4 text-slate-900 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.6)]">
        <label htmlFor="vibe" className="sr-only">
          Conte o que você quer criar
        </label>
        <textarea
          id="vibe"
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Conte o que você quer criar. Ex: um site para minha clínica com agendamento…"
          className="w-full resize-none bg-transparent px-1 text-lg leading-snug text-slate-900 placeholder:text-slate-400 focus:outline-none md:text-xl"
        />
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tipo de projeto">
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={kind === k}
                onClick={() => setKind(kind === k ? null : k)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-300 ${
                  kind === k ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <a
              href={mailtoLink("Projeto — CODE SITE", message())}
              aria-label="Enviar por e-mail"
              title="Enviar por e-mail"
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <MailIcon className="h-[18px] w-[18px]" />
            </a>
            <button
              type="submit"
              aria-label="Enviar no WhatsApp"
              title="Enviar no WhatsApp"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white transition-[transform,background-color] duration-200 hover:bg-[#2238e0] active:scale-95"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden>
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
