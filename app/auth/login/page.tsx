import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, getDefaultHomeForRole } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "User Login",
  description: "Sign in to TheAiStack as a member with email/password or Google."
};

type Props = {
  searchParams: Promise<{ next?: string; error?: string; message?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { next, error, message } = await searchParams;
  const user = await getCurrentUser();
  if (user) {
    redirect(next?.startsWith("/") ? next : getDefaultHomeForRole(user.role));
  }

  return (
    <div className="section-shell">
      <LoginForm error={error} message={message} mode="user" next={next?.startsWith("/") ? next : "/user/dashboard"} />
    </div>
  );
}
