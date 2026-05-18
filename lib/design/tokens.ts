/** Shared typography and layout class names for consistent UI across marketing and academy surfaces. */
export const typography = {
  eyebrow: "text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground",
  display: "font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl",
  h1: "text-3xl font-bold tracking-tight sm:text-4xl",
  h2: "text-2xl font-semibold tracking-tight sm:text-3xl",
  h3: "text-xl font-semibold tracking-tight",
  body: "text-base text-muted-foreground leading-relaxed",
  caption: "text-sm text-muted-foreground",
  lead: "text-lg text-muted-foreground leading-relaxed"
} as const;

export const layout = {
  marketingContainer: "container max-w-7xl",
  academyContainer: "container max-w-6xl",
  section: "py-16 md:py-24",
  sectionCompact: "py-12 md:py-16"
} as const;
