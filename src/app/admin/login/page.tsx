import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/admin/auth-shell";
import { LoginForm } from "@/components/admin/auth-forms";
import { getCurrentAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage(props: PageProps<"/admin/login">) {
  if (await getCurrentAdmin()) redirect("/admin");
  const sp = await props.searchParams;
  return (
    <AuthShell title="Acesso administrativo" subtitle="Entre com suas credenciais para gerenciar a Vault Association.">
      <LoginForm next={typeof sp.next === "string" ? sp.next : undefined} />
    </AuthShell>
  );
}
