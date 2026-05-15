import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser, getDefaultHomeForRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Sign in to the TheAiStack admin console."
};

type Props = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;
  const nextPath = next?.startsWith("/") ? next : "/admin/dashboard";
  const user = await getCurrentUser();

  if (user) {
    redirect(user.role === "admin" ? nextPath : getDefaultHomeForRole(user.role));
  }

  return (
    <div className="section-shell">
      <LoginForm error={error} mode="admin" next={nextPath} />
    </div>
  );
}
