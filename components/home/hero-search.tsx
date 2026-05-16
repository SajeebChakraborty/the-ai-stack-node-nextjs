"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  function submitSearch(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    router.push(`/directory${params}`);
  }

  return (
    <motion.form
      onSubmit={submitSearch}
      className="glass-panel relative grid max-w-2xl gap-3 overflow-hidden rounded-2xl p-3 sm:grid-cols-[1fr_auto]"
      animate={{
        boxShadow: focused
          ? "0 0 0 1px hsl(var(--primary) / 0.45), 0 20px 60px hsl(var(--primary) / 0.18)"
          : "0 0 0 1px hsl(var(--border)), 0 8px 30px hsl(var(--primary) / 0.08)"
      }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5"
        animate={{ opacity: focused ? 1 : 0.35 }}
      />
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search tools, creators, use cases, categories..."
          className="h-12 border-0 bg-transparent pl-9 focus-visible:ring-0"
        />
      </div>
      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
        <Button size="lg" type="submit" className="relative w-full shadow-glow sm:w-auto">
          Explore rankings
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </motion.form>
  );
}
