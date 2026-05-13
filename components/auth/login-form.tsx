"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type LoginMode = "user" | "admin" | "founder";
type AuthTab = "signin" | "signup";
type StatusTone = "default" | "error" | "success";

type StatusState = {
  message: string;
  tone: StatusTone;
} | null;

const copyByMode: Record<
  LoginMode,
  {
    title: string;
    description: string;
    googleLabel?: string;
    defaultEmail?: string;
    helperText: string;
    signInTitle?: string;
    signUpTitle?: string;
    signUpHelperText?: string;
  }
> = {
  user: {
    title: "User login",
    description: "Sign in with email and password or continue with Google.",
    googleLabel: "Continue with Google",
    helperText: "Use Google for quick access, or create a password-based account and verify your email.",
    signInTitle: "Sign in to your user account",
    signUpTitle: "Create your user account",
    signUpHelperText: "Registration sends a verification email before password login is enabled."
  },
  founder: {
    title: "Founder login",
    description: "Sign in with email and password or continue with Google to manage your founder tools.",
    googleLabel: "Continue with Google as founder",
    helperText: "Founder accounts are stored in MySQL and can sign in with Google or a verified password.",
    signInTitle: "Sign in to your founder account",
    signUpTitle: "Create your founder account",
    signUpHelperText: "Founder registration creates a founder profile and sends a verification email."
  },
  admin: {
    title: "Admin login",
    description: "Sign in with the configured admin username and password.",
    defaultEmail: "admin@gmail.com",
    helperText: "Default local credentials: admin@gmail.com / 12345678"
  }
};

function getStatusFromSearchParams(error: string | null | undefined, message: string | null | undefined): StatusState {
  switch (error) {
    case "google-not-configured":
      return { message: "Google OAuth is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.", tone: "error" };
    case "invalid-google-session":
      return { message: "Your Google sign in session expired. Please try again.", tone: "error" };
    case "google-login-failed":
      return { message: "Google sign in failed. Please try again.", tone: "error" };
    case "google-email-not-verified":
      return { message: "Your Google account email must be verified before you can continue.", tone: "error" };
    case "google-account-conflict":
      return { message: "That Google account is already linked to another profile.", tone: "error" };
    case "verification-link-invalid":
      return { message: "That verification link is invalid or expired. Register again to receive a fresh email.", tone: "error" };
    default:
      break;
  }

  if (message === "email-verified") {
    return { message: "Your email has been verified. You can sign in now.", tone: "success" };
  }

  return null;
}

function getStatusClassName(tone: StatusTone) {
  switch (tone) {
    case "error":
      return "text-sm text-destructive";
    case "success":
      return "text-sm text-green-600 dark:text-green-400";
    default:
      return "text-sm text-muted-foreground";
  }
}

function getRequestedRole(mode: LoginMode) {
  return mode === "founder" ? "founder" : "user";
}

export function LoginForm({
  mode,
  next = "/directory",
  error,
  message
}: {
  mode: LoginMode;
  next?: string;
  error?: string;
  message?: string;
}) {
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");
  const [status, setStatus] = useState<StatusState>(() => getStatusFromSearchParams(error, message));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState(copyByMode[mode].defaultEmail ?? "");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  async function signInWithGoogle() {
    setStatus({ message: "Redirecting to Google...", tone: "default" });
    window.location.href = `/api/auth/google?role=${getRequestedRole(mode)}&next=${encodeURIComponent(next)}`;
  }

  async function handleAdminLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ message: "Checking admin credentials...", tone: "default" });

    try {
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          next
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok || !payload.redirectTo) {
        setStatus({ message: payload.error ?? "Admin login failed.", tone: "error" });
        return;
      }

      window.location.href = payload.redirectTo;
    } catch {
      setStatus({ message: "Admin login failed. Please try again.", tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ message: "Signing you in...", tone: "default" });

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          next,
          password,
          role: getRequestedRole(mode)
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok || !payload.redirectTo) {
        setStatus({ message: payload.error ?? "Sign in failed.", tone: "error" });
        return;
      }

      window.location.href = payload.redirectTo;
    } catch {
      setStatus({ message: "Sign in failed. Please try again.", tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ message: "Creating your account...", tone: "default" });

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          name,
          password,
          role: getRequestedRole(mode)
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setStatus({ message: payload.error ?? "Registration failed.", tone: "error" });
        return;
      }

      setStatus({
        message: payload.message ?? "Registration successful. Check your email to verify your account.",
        tone: "success"
      });
      setPassword("");
    } catch {
      setStatus({ message: "Registration failed. Please try again.", tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const copy = copyByMode[mode];

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === "admin" ? (
          <form className="space-y-4" onSubmit={handleAdminLogin}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="admin-email">
                Username
              </label>
              <Input
                id="admin-email"
                autoComplete="username"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@gmail.com"
                required
                type="email"
                value={email}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="admin-password">
                Password
              </label>
              <Input
                id="admin-password"
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="12345678"
                required
                type="password"
                value={password}
              />
            </div>
            <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
              {isSubmitting ? "Signing in..." : "Sign in as admin"}
            </Button>
          </form>
        ) : (
          <Tabs className="w-full" onValueChange={(value) => setActiveTab(value as AuthTab)} value={activeTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="space-y-4">
              <form className="space-y-4" onSubmit={handleEmailLogin}>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor={`${mode}-signin-email`}>
                    Email
                  </label>
                  <Input
                    id={`${mode}-signin-email`}
                    autoComplete="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    type="email"
                    value={email}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor={`${mode}-signin-password`}>
                    Password
                  </label>
                  <Input
                    id={`${mode}-signin-password`}
                    autoComplete="current-password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    type="password"
                    value={password}
                  />
                </div>
                <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
                  {isSubmitting ? "Signing in..." : copy.signInTitle}
                </Button>
              </form>
              <div className="text-center text-sm text-muted-foreground">or</div>
              <Button className="w-full" size="lg" variant="outline" onClick={signInWithGoogle}>
                <Chrome className="mr-2 h-4 w-4" />
                {copy.googleLabel}
              </Button>
            </TabsContent>
            <TabsContent value="signup" className="space-y-4">
              <form className="space-y-4" onSubmit={handleRegistration}>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor={`${mode}-signup-name`}>
                    Name
                  </label>
                  <Input
                    id={`${mode}-signup-name`}
                    autoComplete="name"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your full name"
                    required
                    value={name}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor={`${mode}-signup-email`}>
                    Email
                  </label>
                  <Input
                    id={`${mode}-signup-email`}
                    autoComplete="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    type="email"
                    value={email}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor={`${mode}-signup-password`}>
                    Password
                  </label>
                  <Input
                    id={`${mode}-signup-password`}
                    autoComplete="new-password"
                    minLength={8}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a password"
                    required
                    type="password"
                    value={password}
                  />
                </div>
                <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
                  {isSubmitting ? "Creating account..." : copy.signUpTitle}
                </Button>
              </form>
              <div className="text-center text-sm text-muted-foreground">or</div>
              <Button className="w-full" size="lg" variant="outline" onClick={signInWithGoogle}>
                <Chrome className="mr-2 h-4 w-4" />
                {copy.googleLabel}
              </Button>
              <p className="text-sm text-muted-foreground">{copy.signUpHelperText}</p>
            </TabsContent>
          </Tabs>
        )}
        <p className="text-sm text-muted-foreground">{copy.helperText}</p>
        {status ? <p className={cn(getStatusClassName(status.tone))}>{status.message}</p> : null}
      </CardContent>
    </Card>
  );
}
