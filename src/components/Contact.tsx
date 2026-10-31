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
    <section id="contato" className="relative overflow-hidden bg-bg py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <Reveal className="text-center">
          <h2 className="mx-auto max-w-5xl font-display text-[clamp(2.8rem,9vw,8rem)] font-bold leading-[0.92] tracking-[-0.045em]">
            Vamos tirar
            <br />
            do papel.
          </h2>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-10 inline-flex items-center gap-3 rounded-full bg-ink px-9 py-5 text-lg font-semibold text-paper transition-[background-color,transform] duration-200 hover:bg-brand active:scale-[0.97]"
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
                      className={`group flex items-center gap-4 rounded-2xl p-5 transition-[background-color,transform] duration-200 hover:-translate-y-0.5 ${
                        s.id === "whatsapp" ? "bg-brand text-paper hover:bg-[#2238e0]" : "bg-bg-soft hover:bg-[#dededa]"
                      }`}
                    >
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                          s.id === "whatsapp" ? "bg-paper/15" : "bg-paper"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-lg font-bold">{s.label}</span>
                        <span
                          className={`block truncate text-[0.95rem] ${
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
            <form onSubmit={sendWhatsApp} className="rounded-3xl bg-bg-soft p-6 md:p-8" noValidate>
              <h3 className="font-display text-2xl font-bold tracking-tight">Conte sobre o projeto</h3>
              <p className="mt-1 text-[0.95rem] text-ink-soft">
                A mensagem já vai pronta para o WhatsApp ou e-mail, é só enviar.
              </p>

              <label className="mt-6 block">
                <span className="text-[0.95rem] font-semibold text-ink">Seu nome</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none transition-colors focus:border-brand"
                  placeholder="Como podemos te chamar?"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "contact-error" : undefined}
                />
              </label>

              <fieldset className="mt-5">
                <legend className="text-[0.95rem] font-semibold text-ink">
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
                      <span className="block rounded-full bg-paper px-3.5 py-2 text-[0.95rem] transition-colors peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-brand hover:bg-[#dededa]">
                        {t}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="mt-5 block">
                <span className="text-[0.95rem] font-semibold text-ink">
                  Mensagem (opcional)
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-xl border border-line bg-paper px-4 py-3 outline-none transition-colors focus:border-brand"
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
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 text-base font-semibold text-paper transition-[background-color,transform] duration-200 hover:bg-brand active:scale-[0.97]"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Enviar no WhatsApp
                </button>
                <button
                  type="button"
                  onClick={sendEmail}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-paper px-6 py-4 text-base font-semibold transition-[background-color,transform] duration-200 hover:bg-[#dededa] active:scale-[0.97]"
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
