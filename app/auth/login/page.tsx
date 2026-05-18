import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, getDefaultHomeForRole } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";
import { buildPageMetadata } from "@/lib/seo/build-metadata";
import { Logo } from "@/components/layout/logo";
import { typography } from "@/lib/design/tokens";

export const metadata: Metadata = buildPageMetadata({
  title: "Sign in",
  description: "Sign in to TheAiStack as a member with email/password or Google.",
  path: "/auth/login",
  noIndex: true
});

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
    <div className="min-h-[calc(100vh-4rem)] lg:grid lg:grid-cols-2">
      <div className="hidden flex-col justify-between border-r bg-secondary/30 p-10 lg:flex">
        <Logo />
        <div className="space-y-4">
          <h1 className={typography.h1}>Welcome back to TheAiStack</h1>
          <p className={typography.lead}>
            Access your courses, certificates, bookmarks, and founder tools from one dashboard.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">© 2026 TheAiStack</p>
      </div>
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden">
            <Logo />
          </div>
          <LoginForm error={error} message={message} mode="user" next={next?.startsWith("/") ? next : "/user/dashboard"} />
        </div>
      </div>
    </div>
  );
}
