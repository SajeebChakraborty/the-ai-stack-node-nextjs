"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { showErrorAlert, showSuccessAlert } from "@/lib/ui/sweet-alert";
import {
  validateAdminSignInFields,
  validateSignInFields,
  validateSignUpFields
} from "@/lib/validation/auth-form";
import "sweetalert2/dist/sweetalert2.min.css";

type LoginMode = "user" | "admin" | "founder";
type AuthTab = "signin" | "signup";

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

function getMessageFromSearchParams(error: string | null | undefined, message: string | null | undefined) {
  switch (error) {
    case "google-not-configured":
      return {
        tone: "error" as const,
        title: "Google sign in unavailable",
        text: "Google OAuth is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
      };
    case "invalid-google-session":
      return {
        tone: "error" as const,
        title: "Session expired",
        text: "Your Google sign in session expired. Please try again."
      };
    case "google-login-failed":
      return { tone: "error" as const, title: "Google sign in failed", text: "Please try again." };
    case "google-email-not-verified":
      return {
        tone: "error" as const,
        title: "Email not verified",
        text: "Your Google account email must be verified before you can continue."
      };
    case "google-account-conflict":
      return {
        tone: "error" as const,
        title: "Account conflict",
        text: "That Google account is already linked to another profile."
      };
    case "wrong-account-portal":
      return {
        tone: "error" as const,
        title: "Wrong login page",
        text: "This account belongs to a different login portal. Use the correct sign in page."
      };
    case "verification-link-invalid":
      return {
        tone: "error" as const,
        title: "Invalid verification link",
        text: "That link is invalid or expired. Register again to receive a fresh email."
      };
    default:
      break;
  }

  if (message === "email-verified") {
    return {
      tone: "success" as const,
      title: "Email verified",
      text: "Your email has been verified. You can sign in now."
    };
  }

  return null;
}

function getRequestedRole(_mode: LoginMode) {
  return "user" as const;
}

export function LoginForm({
  mode,
  next = "/user/dashboard",
  error,
  message
}: {
  mode: LoginMode;
  next?: string;
  error?: string;
  message?: string;
}) {
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState(copyByMode[mode].defaultEmail ?? "");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const alertPayload = getMessageFromSearchParams(error, message);
    if (!alertPayload) {
      return;
    }

    if (alertPayload.tone === "error") {
      void showErrorAlert({ title: alertPayload.title, text: alertPayload.text });
      return;
    }

    void showSuccessAlert({ title: alertPayload.title, text: alertPayload.text });
  }, [error, message]);

  function signInWithGoogle() {
    window.location.href = `/api/auth/google?next=${encodeURIComponent(next)}`;
  }

  async function handleAdminLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateAdminSignInFields(email, password);
    if (validationError) {
      void showErrorAlert({ title: "Check your details", text: validationError });
      return;
    }

    setIsSubmitting(true);

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
        void showErrorAlert({
          title: "Admin sign in failed",
          text: payload.error ?? "Check your admin email and password."
        });
        return;
      }

      window.location.href = payload.redirectTo;
    } catch {
      void showErrorAlert({
        title: "Admin sign in failed",
        text: "Something went wrong. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateSignInFields(email, password);
    if (validationError) {
      void showErrorAlert({ title: "Check your details", text: validationError });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim(),
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
        void showErrorAlert({
          title: "Sign in failed",
          text: payload.error ?? "Invalid email or password."
        });
        return;
      }

      window.location.href = payload.redirectTo;
    } catch {
      void showErrorAlert({
        title: "Sign in failed",
        text: "Something went wrong. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateSignUpFields(name, email, password);
    if (validationError) {
      void showErrorAlert({ title: "Check your details", text: validationError });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          password,
          role: getRequestedRole(mode)
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        void showErrorAlert({
          title: "Registration failed",
          text: payload.error ?? "Could not create your account. Please try again."
        });
        return;
      }

      void showSuccessAlert({
        title: "Account created",
        text: payload.message ?? "Check your email to verify your account before signing in."
      });
      setPassword("");
    } catch {
      void showErrorAlert({
        title: "Registration failed",
        text: "Something went wrong. Please try again."
      });
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
          <form className="space-y-4" noValidate onSubmit={handleAdminLogin}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="admin-email">
                Username
              </label>
              <Input
                id="admin-email"
                autoComplete="username"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@gmail.com"
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
              <form className="space-y-4" noValidate onSubmit={handleEmailLogin}>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor={`${mode}-signin-email`}>
                    Email
                  </label>
                  <Input
                    id={`${mode}-signin-email`}
                    autoComplete="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
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
              <form className="space-y-4" noValidate onSubmit={handleRegistration}>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor={`${mode}-signup-name`}>
                    Name
                  </label>
                  <Input
                    id={`${mode}-signup-name`}
                    autoComplete="name"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your full name"
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
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a password (min. 8 characters)"
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
      </CardContent>
    </Card>
  );
}
