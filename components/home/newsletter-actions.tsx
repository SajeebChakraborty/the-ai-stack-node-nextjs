"use client";

import { useState } from "react";
import { Mail, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterActions() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  function join(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!value || !value.includes("@")) {
      setStatus("Enter a valid email to join the weekly digest.");
      return;
    }
    localStorage.setItem("theaistack_newsletter_email", value);
    setStatus("You are subscribed to the weekly AI stack digest.");
  }

  return (
    <div className="grid gap-2">
      <form onSubmit={join} className="flex min-w-[280px] gap-2">
        <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="bg-background text-foreground" />
        <Button variant="secondary" type="submit">
          <Mail className="mr-2 h-4 w-4" />
          Join
        </Button>
      </form>
      <Button asChild variant="outline" className="border-background/20 bg-transparent text-background hover:bg-background/10">
        <a href="mailto:sponsors@theaistack.com?subject=Sponsor%20TheAiStack">
          <Megaphone className="mr-2 h-4 w-4" />
          Sponsor
        </a>
      </Button>
      {status ? <p className="text-sm text-background/70">{status}</p> : null}
    </div>
  );
}
