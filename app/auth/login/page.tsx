import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to TheAiStack with email, Google, X, or GitHub."
};

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const nextPath = next?.startsWith("/") ? next : "/directory";
  const user = await getCurrentUser();
  if (user) {
    redirect(nextPath);
  }

  return (
    <div className="section-shell">
      <LoginForm next={nextPath} />
    </div>
  );
}
