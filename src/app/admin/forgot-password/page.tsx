import type { Metadata } from "next";
import { AuthShell } from "@/components/admin/auth-shell";
import { ForgotForm } from "@/components/admin/auth-forms";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Recuperar senha" subtitle="Enviaremos um link seguro, válido por 30 minutos, para o e-mail cadastrado.">
      <ForgotForm />
    </AuthShell>
  );
}
