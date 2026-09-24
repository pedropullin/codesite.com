import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/admin/auth-shell";
import { ResetForm } from "@/components/admin/auth-forms";
import { validateResetToken } from "@/lib/auth/reset";

export const metadata: Metadata = { title: "Redefinir senha" };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage(props: PageProps<"/admin/reset-password">) {
  const sp = await props.searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const user = token ? await validateResetToken(token) : null;
  return (
    <AuthShell title="Redefinir senha" subtitle={user ? `Defina uma nova senha para ${user.email}.` : "Este link é inválido ou expirou."}>
      {user ? (
        <ResetForm token={token} />
      ) : (
        <Link href="/admin/forgot-password" className="text-sm underline">Solicitar um novo link</Link>
      )}
    </AuthShell>
  );
}
