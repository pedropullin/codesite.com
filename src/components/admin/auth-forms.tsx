"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { forgotPasswordAction, loginAction, resetPasswordAction, type AuthState } from "@/app/admin/auth-actions";
import { Button, Field, Input } from "./ui";

function Message({ state }: { state: AuthState }) {
  if (!state) return null;
  return (
    <>
      {state.error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.success && <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p>}
      {state.devLink && (
        <p className="rounded-md border border-dashed border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
          Ambiente de desenvolvimento (sem serviço de e-mail configurado):{" "}
          <a className="break-all font-medium text-foreground underline" href={state.devLink}>abrir link de redefinição</a>
        </p>
      )}
    </>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const [email, setEmail] = useState("");
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field
        label="Senha"
        htmlFor="password"
        aside={<Link href="/admin/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">Esqueci a senha</Link>}
      >
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Message state={state} />
      <Button type="submit" className="w-full" loading={pending}>Entrar</Button>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, undefined);
  const [email, setEmail] = useState("");
  return (
    <form action={action} className="space-y-5">
      <Field label="E-mail cadastrado" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Message state={state} />
      <Button type="submit" className="w-full" loading={pending}>Enviar link de redefinição</Button>
      <Link href="/admin/login" className="block text-center text-xs text-muted-foreground hover:text-foreground">Voltar ao login</Link>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, undefined);
  if (state?.success) {
    return (
      <div className="space-y-5">
        <Message state={state} />
        <Link href="/admin/login" className="block"><Button className="w-full">Ir para o login</Button></Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <Field label="Nova senha" htmlFor="password" hint="Mínimo de 8 caracteres">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} autoFocus />
      </Field>
      <Field label="Confirmar nova senha" htmlFor="confirm">
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Message state={state} />
      <Button type="submit" className="w-full" loading={pending}>Redefinir senha</Button>
    </form>
  );
}
