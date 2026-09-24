"use client";

import { useState, type FormEvent } from "react";
import Reveal from "./Reveal";
import { ArrowUpRight, MailIcon, WhatsAppIcon, socialIcons } from "./icons";
import { mailtoLink, socials, whatsappLink } from "@/lib/site";

const PROJECT_TYPES = ["Site institucional", "Landing page", "E-commerce", "Sistema / app web", "Experiência 3D", "Outro"];

export default function Contact() {
  const [name, setName] = useState("");
  const [type, setType] = useState(PROJECT_TYPES[0]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const compose = () =>
    [
      `Olá! Meu nome é ${name.trim()}.`,
      `Tenho interesse em: ${type}.`,
      message.trim() ? `\n${message.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

  const validate = () => {
    if (!name.trim()) {
      setError("Diga seu nome para a gente saber com quem está falando.");
      return false;
    }
    setError("");
    return true;
  };

  const sendWhatsApp = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    window.open(whatsappLink(compose()), "_blank", "noopener,noreferrer");
  };

  const sendEmail = () => {
    if (!validate()) return;
    window.location.href = mailtoLink(`Projeto: ${type} — ${name.trim()}`, compose());
  };

  const channels = socials.filter((s) => s.id !== "linkedin");

  return (
    <section id="contato" className="relative overflow-hidden border-t border-line py-24 grid-bg md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <Reveal className="text-center">
          <span className="mb-6 inline-flex items-center gap-2.5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.24em] text-ink-soft">
            <span className="h-px w-6 bg-brand" />
            Tem um projeto?
          </span>
          <h2 className="mx-auto max-w-5xl font-display text-[13vw] font-bold uppercase leading-[0.9] tracking-[-0.035em] sm:text-[9vw] lg:text-[7.2rem]">
            Vamos tirar
            <br />
            <span className="text-brand">do papel.</span>
          </h2>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-10 inline-flex items-center gap-3 rounded-full bg-ink px-9 py-5 font-mono text-[0.8rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors duration-300 hover:bg-brand"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Vamos criar
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </Reveal>

        <div className="mt-20 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <ul className="grid gap-3 sm:grid-cols-2">
              {channels.map((s) => {
                const Icon = socialIcons[s.id];
                return (
                  <li key={s.id} className={s.id === "whatsapp" ? "sm:col-span-2" : ""}>
                    <a
                      href={s.href}
                      target={s.id === "email" ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className={`group flex items-center gap-4 rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 ${
                        s.id === "whatsapp"
                          ? "border-brand bg-brand text-paper hover:shadow-[0_20px_40px_-20px_rgba(43,70,255,0.8)]"
                          : "border-line bg-paper hover:border-ink"
                      }`}
                    >
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                          s.id === "whatsapp" ? "bg-paper/15" : "bg-bg-soft"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-lg font-bold">{s.label}</span>
                        <span
                          className={`block truncate font-mono text-[0.72rem] ${
                            s.id === "whatsapp" ? "text-paper/75" : "text-ink-soft"
                          }`}
                        >
                          {s.handle}
                        </span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </Reveal>

          <Reveal delay={120}>
            <form onSubmit={sendWhatsApp} className="rounded-3xl border border-line bg-paper p-6 md:p-8" noValidate>
              <h3 className="font-display text-2xl font-bold tracking-tight">Conte sobre o projeto</h3>
              <p className="mt-1 text-sm text-ink-soft">
                A mensagem já vai pronta para o WhatsApp ou e-mail — é só enviar.
              </p>

              <label className="mt-6 block">
                <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink-soft">Seu nome</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="mt-2 w-full rounded-xl border border-line bg-bg px-4 py-3 outline-none transition-colors focus:border-brand"
                  placeholder="Como podemos te chamar?"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "contact-error" : undefined}
                />
              </label>

              <fieldset className="mt-5">
                <legend className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink-soft">
                  Tipo de projeto
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PROJECT_TYPES.map((t) => (
                    <label key={t} className="cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value={t}
                        checked={type === t}
                        onChange={() => setType(t)}
                        className="peer sr-only"
                      />
                      <span className="block rounded-full border border-line px-3.5 py-2 text-sm transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-brand hover:border-ink">
                        {t}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="mt-5 block">
                <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink-soft">
                  Mensagem (opcional)
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-xl border border-line bg-bg px-4 py-3 outline-none transition-colors focus:border-brand"
                  placeholder="Prazo, referências, o que você imagina…"
                />
              </label>

              {error && (
                <p id="contact-error" role="alert" className="mt-3 text-sm text-[#c8361f]">
                  {error}
                </p>
              )}

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 font-mono text-[0.74rem] font-medium uppercase tracking-[0.14em] text-paper transition-colors hover:bg-brand"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Enviar no WhatsApp
                </button>
                <button
                  type="button"
                  onClick={sendEmail}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-6 py-4 font-mono text-[0.74rem] font-medium uppercase tracking-[0.14em] transition-colors hover:border-ink"
                >
                  <MailIcon className="h-4 w-4" />
                  Enviar por e-mail
                </button>
              </div>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
