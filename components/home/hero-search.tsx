"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submitSearch(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    router.push(`/directory${params}`);
  }

  return (
    <form onSubmit={submitSearch} className="minimal-surface grid max-w-2xl gap-3 rounded-lg p-3 sm:grid-cols-[1fr_auto]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools, creators, use cases, categories..." className="h-12 border-0 bg-transparent pl-9 focus-visible:ring-0" />
      </div>
      <Button size="lg" type="submit">
        Explore rankings
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
