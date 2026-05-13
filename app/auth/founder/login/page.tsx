import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser, getDefaultHomeForRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Founder Login",
  description: "Sign in to TheAiStack as a founder with email/password or Google."
};

type Props = {
  searchParams: Promise<{ next?: string; error?: string; message?: string }>;
};

export default async function FounderLoginPage({ searchParams }: Props) {
  const { next, error, message } = await searchParams;
  const nextPath = next?.startsWith("/") ? next : "/founder/dashboard";
  const user = await getCurrentUser();

  if (user) {
    const destination = user.role === "founder" || user.role === "admin" ? nextPath : getDefaultHomeForRole(user.role);
    redirect(destination);
  }

  return (
    <div className="section-shell">
      <LoginForm error={error} message={message} mode="founder" next={nextPath} />
    </div>
  );
}
