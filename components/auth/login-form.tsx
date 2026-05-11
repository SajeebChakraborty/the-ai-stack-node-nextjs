"use client";

import { useState } from "react";
import { Chrome } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm({ next = "/directory" }: { next?: string }) {
  const [status, setStatus] = useState<string | null>(null);

  async function signInWithGoogle() {
    setStatus("Opening Google sign in...");
    const hasSupabaseConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    if (hasSupabaseConfig) {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
        }
      });
      if (error) setStatus(error.message);
      return;
    }

    await fetch("/api/auth/demo-google", { method: "POST" });
    window.location.href = next;
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in or sign up</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="w-full" size="lg" onClick={signInWithGoogle}>
          <Chrome className="mr-2 h-4 w-4" />
          Continue with Google
        </Button>
        <p className="text-sm text-muted-foreground">Google is the only account creation method enabled for this platform.</p>
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      </CardContent>
    </Card>
  );
}
