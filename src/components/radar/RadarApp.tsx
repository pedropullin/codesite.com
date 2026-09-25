"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import LeadFinder from "@/components/leads/LeadFinder";
import { cloudSync, supabase } from "@/lib/cloud";

export const APP_NAME = "Radar";
const LOCAL_CACHE_KEY = "codesite-leads-v1";

export function RadarMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--brand)" />
      <circle cx="16" cy="16" r="9" fill="none" stroke="var(--paper)" strokeWidth="2" opacity="0.45" />
      <circle cx="16" cy="16" r="4.5" fill="none" stroke="var(--paper)" strokeWidth="2" opacity="0.75" />
      <path d="M16 16 23.5 9.5" stroke="var(--paper)" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="21.5" cy="12.5" r="1.8" fill="var(--paper)" />
    </svg>
  );
}

function Brand() {
  return (
    <span className="flex items-center gap-2.5 font-display text-lg font-bold">
      <RadarMark className="h-8 w-8" />
      {APP_NAME}
    </span>
  );
}

const AUTH_ERRORS: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "User already registered": "Esse e-mail já tem conta. Toque em Entrar.",
  "Email not confirmed": "Confirme seu e-mail pelo link que enviamos antes de entrar.",
};

function AuthScreen() {
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const { data, error } =
      mode === "entrar"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/radar` } });
    setBusy(false);
    if (error) {
      setMessage({ tone: "error", text: AUTH_ERRORS[error.message] ?? error.message });
    } else if (mode === "criar" && !data.session) {
      setMessage({ tone: "ok", text: "Conta criada. Abra o link que chegou no seu e-mail e depois entre aqui." });
      setMode("entrar");
    }
  };

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-bg px-4 text-ink">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-line bg-paper p-6">
        <Brand />
        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight">
          {mode === "entrar" ? "Entrar" : "Criar conta"}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">Encontre clientes sem site e acompanhe cada conversa.</p>

        <label className="mt-5 block">
          <span className="text-xs font-semibold text-ink-soft">E-mail</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-xs font-semibold text-ink-soft">Senha</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "entrar" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>

        {message && (
          <p role="alert" className={`mt-3 text-sm ${message.tone === "error" ? "text-[#c8361f]" : "text-brand"}`}>
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full rounded-full bg-brand py-3.5 font-semibold text-paper disabled:opacity-50"
        >
          {busy ? "Aguarde…" : mode === "entrar" ? "Entrar" : "Criar conta"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "entrar" ? "criar" : "entrar");
            setMessage(null);
          }}
          className="mt-3 w-full text-sm font-semibold text-ink-soft"
        >
          {mode === "entrar" ? "Não tem conta? Criar agora" : "Já tenho conta"}
        </button>
      </form>
    </div>
  );
}

export default function RadarApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const sync = useMemo(() => (session ? cloudSync(supabase) : undefined), [session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <div className="flex min-h-[100svh] items-center justify-center bg-bg text-sm text-ink-soft">Carregando…</div>;
  }

  if (!session) return <AuthScreen />;

  return (
    <LeadFinder
      key={session.user.id}
      brand={<Brand />}
      sync={sync}
      account={{ email: session.user.email ?? "", onSignOut: () => {
          // The device cache must not leak into the next account that signs in here.
          localStorage.removeItem(LOCAL_CACHE_KEY);
          void supabase.auth.signOut();
        }, }}
    />
  );
}
