"use client";

import { useState, type FormEvent } from "react";
import Reveal from "./Reveal";
import { RunKeys } from "./three/Lazy";
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
    <section id="contato" className="relative isolate overflow-hidden bg-bg py-28 md:py-36">
      <div className="aurora" aria-hidden>
        <div className="aurora-blade aurora-b1" />
        <div className="aurora-blade aurora-b3" />
        <div className="aurora-blade aurora-b4" />
      </div>
      <div className="aurora-grain" aria-hidden />
      <div className="aurora-vignette aurora-vignette-both" aria-hidden />
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <div className="text-center">
          <h2 data-split="chars" className="mx-auto max-w-5xl font-display text-[clamp(2.8rem,9vw,8rem)] font-medium leading-[1.02] tracking-tight">
            Vamos tirar
            <br />
            do papel.
          </h2>
          <div className="relative mx-auto mt-6 h-[230px] max-w-3xl sm:h-[300px]">
            <RunKeys />
          </div>
          <p className="text-[0.95rem] text-ink-soft">Aperte RUN para chamar a gente no WhatsApp, ou use o botão.</p>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            data-fade className="magnetic group mt-6 keycap inline-flex items-center justify-center gap-2.5 rounded-lg px-8 py-4 text-lg font-medium"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Vamos criar
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

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
                        s.id === "whatsapp" ? "bg-brand text-white hover:bg-[#2238e0]" : "border border-line bg-bg-soft hover:bg-paper"
                      }`}
                    >
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                          s.id === "whatsapp" ? "bg-white/15" : "bg-paper"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-lg font-semibold">{s.label}</span>
                        <span
                          className={`block truncate text-[0.95rem] ${
                            s.id === "whatsapp" ? "text-white/75" : "text-ink-soft"
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
            <form onSubmit={sendWhatsApp} className="glass-strong rounded-3xl p-6 md:p-8" noValidate>
              <h3 className="font-display text-2xl font-medium tracking-tight">Conte sobre o projeto</h3>
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
                      <span className="block rounded-full bg-paper px-3.5 py-2 text-[0.95rem] transition-colors peer-checked:bg-white peer-checked:text-[#07080a] peer-focus-visible:outline-2 peer-focus-visible:outline-brand hover:bg-white/10">
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
                <p id="contact-error" role="alert" className="mt-3 text-sm text-[#ff8a80]">
                  {error}
                </p>
              )}

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <button
                  type="submit"
                  className="keycap inline-flex items-center justify-center gap-2.5 rounded-lg px-6 py-4 text-base font-medium"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Enviar no WhatsApp
                </button>
                <button
                  type="button"
                  onClick={sendEmail}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-paper px-6 py-4 text-base font-medium transition-[background-color,transform] duration-200 hover:bg-white/10 active:scale-[0.97]"
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
