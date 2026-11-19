"use client";

import { useState } from "react";
import { whatsappLink } from "@/lib/site";

const ITEMS = [
  {
    q: "Quanto custa um site?",
    a: "Depende do tamanho e do que ele precisa fazer. Você conta a ideia pelo WhatsApp e recebe um orçamento sem compromisso, com o que está incluído escrito.",
  },
  {
    q: "Quanto tempo leva?",
    a: "Combinamos o prazo no orçamento, antes de começar. Durante o projeto você acompanha tudo por um link ao vivo e vê cada tela antes de ir para o ar.",
  },
  {
    q: "Eu consigo atualizar o site depois?",
    a: "Sim. Quando o site precisa de textos, fotos ou produtos que mudam, ele vem com um painel simples para você editar sem mexer em código.",
  },
  {
    q: "Vocês cuidam de domínio e hospedagem?",
    a: "Sim. Publicamos com domínio próprio, certificado de segurança, SEO e analytics configurados, e o site fica numa hospedagem rápida.",
  },
  {
    q: "Dá para integrar com WhatsApp, Pix e Instagram?",
    a: "Dá. Botões que abrem a conversa com a mensagem pronta, pagamentos por Pix e cartão, feed do Instagram, agendamento e o que mais o seu negócio usar.",
  },
  {
    q: "E depois que o site estiver no ar?",
    a: "Seguimos dando suporte. Ajustes, novas páginas e melhorias podem ser feitos a qualquer momento, é só chamar.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="duvidas" className="theme-light" style={{ ["--bg" as string]: "#ffffff" }}>
      <div className="mx-auto max-w-4xl px-5 py-28 md:px-10 md:py-36">
        <h2
          data-split
          className="text-center font-display text-[clamp(2.4rem,5.5vw,4.5rem)] font-medium leading-[1.05] tracking-tight"
        >
          Dúvidas <em className="font-medium">comuns.</em>
        </h2>
        <ul className="mt-14 space-y-3">
          {ITEMS.map((item, i) => {
            const on = open === i;
            return (
              <li key={item.q} className="faq-item rounded-2xl bg-[#f3f4f6]">
                <h3>
                  <button
                    type="button"
                    id={`faq-q-${i}`}
                    aria-expanded={on}
                    aria-controls={`faq-a-${i}`}
                    onClick={() => setOpen(on ? null : i)}
                    className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left text-lg font-semibold text-slate-900 md:px-7"
                  >
                    {item.q}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`h-5 w-5 shrink-0 text-slate-500 transition-transform duration-500 ease-in-out ${on ? "rotate-180" : ""}`}
                      aria-hidden
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </h3>
                <div
                  id={`faq-a-${i}`}
                  role="region"
                  aria-labelledby={`faq-q-${i}`}
                  className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-[1.05rem] leading-relaxed text-slate-600 md:px-7">{item.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-10 text-center text-slate-600">
          Ficou outra dúvida?{" "}
          <a href={whatsappLink("Olá! Tenho uma dúvida sobre um site.")} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline-offset-4 hover:underline">
            Pergunte no WhatsApp
          </a>
        </p>
      </div>
    </section>
  );
}
