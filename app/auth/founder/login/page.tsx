import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to TheAiStack to manage listings, claims, and your dashboard."
};

type Props = {
  searchParams: Promise<{ next?: string; error?: string; message?: string }>;
};

/** Legacy founder login — one member login at /auth/login. */
export default async function FounderLoginPage({ searchParams }: Props) {
  const { next, error, message } = await searchParams;
  const params = new URLSearchParams();
  params.set("next", next?.startsWith("/") ? next : "/user/dashboard");
  if (error) {
    params.set("error", error);
  }
  if (message) {
    params.set("message", message);
  }

  redirect(`/auth/login?${params.toString()}`);

  // import { LoginForm } from "@/components/auth/login-form";
  // import { getCurrentUser, getDefaultHomeForRole } from "@/lib/auth/session";
  // ...
  // <LoginForm mode="founder" ... />
}
