"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Newspaper, PlayCircle, Quote, Rocket, Star, Trophy, Users } from "lucide-react";
import { creators, news, reviews, tools } from "@/data/catalog";
import { sortTools } from "@/lib/utils/ranking";
import { ToolCard } from "@/components/directory/tool-card";
import { NewsletterActions } from "@/components/home/newsletter-actions";
import { ScrollReveal, StaggerItem, StaggerReveal } from "@/components/home/scroll-reveal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RemoteImage } from "@/components/ui/remote-image";

export function HomeSections() {
  const trending = sortTools(tools, "trending");
  const topRated = sortTools(tools, "top-rated");
  const latest = sortTools(tools, "newest");

  return (
    <>
      <section className="section-shell">
        <ScrollReveal>
          <SectionHeading eyebrow="Directory" title="Trending AI tools" actionHref="/directory" action="View directory" />
        </ScrollReveal>
        <StaggerReveal className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trending.slice(0, 3).map((tool) => (
            <StaggerItem key={tool.id}>
              <ToolCard tool={tool} analyticsSource="home" />
            </StaggerItem>
          ))}
        </StaggerReveal>
      </section>

      <section className="relative overflow-hidden border-y bg-secondary/20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,hsl(var(--primary)/0.08),transparent_50%)]" />
        <div className="section-shell relative grid gap-6 lg:grid-cols-[1fr_1fr]">
          <ScrollReveal>
            <SectionHeading eyebrow="Featured" title="Editor-picked market leaders" />
            <div className="mt-6 grid gap-4">
              {topRated.slice(0, 2).map((tool, index) => (
                <motion.div
                  key={tool.id}
                  whileHover={{ y: -6, rotateX: 2, rotateY: index % 2 === 0 ? -2 : 2 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <Card className="overflow-hidden border-primary/15 bg-card/80 backdrop-blur">
                    <CardContent className="flex gap-4 p-4">
                      {tool.screenshots[0] ? (
                        <RemoteImage
                          src={tool.screenshots[0]}
                          alt={`${tool.name} screenshot`}
                          width={220}
                          height={140}
                          className="hidden aspect-video w-48 rounded-md object-cover sm:block"
                        />
                      ) : null}
                      <div className="space-y-2">
                        <Badge variant="premium">
                          <Trophy className="mr-1 h-3 w-3" />
                          Editor pick
                        </Badge>
                        <h3 className="text-xl font-semibold">{tool.name}</h3>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/tools/${tool.slug}`}>Open profile</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.12}>
            <SectionHeading eyebrow="Creator spotlight" title="Trusted reviewers drive better discovery" />
            <StaggerReveal className="mt-6 grid gap-4">
              {creators.map((creator) => (
                <StaggerItem key={creator.id}>
                  <motion.div whileHover={{ scale: 1.02, x: 4 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
                    <Card className="border-border/80 bg-card/90">
                      <CardContent className="flex items-center justify-between gap-4 p-4">
                        <motion.div className="flex items-center gap-3" whileHover={{ x: 2 }}>
                          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                            <AvatarImage src={creator.avatarUrl} alt={creator.name} />
                            <AvatarFallback>{creator.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{creator.name}</div>
                            <div className="text-sm text-muted-foreground">{creator.niche}</div>
                          </div>
                        </motion.div>
                        <div className="text-right text-sm">
                          <div className="font-semibold text-primary">{creator.trustScore}/100</div>
                          <div className="text-muted-foreground">trust</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerReveal>
          </ScrollReveal>
        </div>
      </section>

      <section className="section-shell grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <ScrollReveal>
          <SectionHeading eyebrow="Reviews" title="Featured proof from verified buyers and creators" />
          <StaggerReveal className="mt-6 grid gap-4">
            {reviews.map((review) => (
              <StaggerItem key={review.id}>
                <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}>
                  <Card className="overflow-hidden">
                    <CardContent className="relative p-5">
                      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={review.authorAvatar} alt={review.author} />
                            <AvatarFallback>{review.author.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{review.author}</div>
                            <div className="text-xs text-muted-foreground">@{review.authorHandle}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: review.rating }).map((_, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0 }}
                              whileInView={{ opacity: 1, scale: 1 }}
                              viewport={{ once: true }}
                              transition={{ delay: index * 0.06 }}
                            >
                              <Star className="h-4 w-4 fill-current" />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      <h3 className="font-semibold">{review.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{review.body}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <div className="grid gap-4">
            <SectionHeading eyebrow="Media network" title="AI news and launch intelligence" />
            {news.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ x: -4, scale: 1.01 }}
              >
                <Card>
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit">
                      <Newspaper className="mr-1 h-3 w-3" />
                      {article.category}
                    </Badge>
                    <CardTitle className="leading-snug">{article.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                    <div className="mt-4 text-xs text-muted-foreground">
                      {article.author} · {article.readTime}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      <section className="relative overflow-hidden border-y bg-secondary/20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--primary)/0.1),transparent_45%)]" />
        <div className="section-shell relative">
          <ScrollReveal>
            <SectionHeading eyebrow="Launches" title="Latest launches with founder video, reviews, and traction" />
          </ScrollReveal>
          <StaggerReveal className="mt-6 grid gap-4 md:grid-cols-3">
            {latest.slice(0, 3).map((tool) => (
              <StaggerItem key={tool.id}>
                <motion.div
                  className="h-full [perspective:900px]"
                  whileHover={{ rotateX: 4, rotateY: -4, y: -8 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <Card className="h-full overflow-hidden border-primary/10 shadow-glow">
                    {tool.screenshots[0] ? (
                      <RemoteImage
                        src={tool.screenshots[0]}
                        alt={`${tool.name} launch`}
                        width={500}
                        height={300}
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      <div className="aspect-video w-full bg-secondary" />
                    )}
                    <CardContent className="p-4">
                      <Badge variant="secondary">
                        <Rocket className="mr-1 h-3 w-3" />
                        Launched {new Date(tool.launchedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                      </Badge>
                      <h3 className="mt-3 text-lg font-semibold">{tool.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{tool.tagline}</p>
                      <Button asChild variant="ghost" size="sm" className="mt-3 px-0">
                        <Link href={`/tools/${tool.slug}`}>
                          Watch launch
                          <PlayCircle className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
      </section>

      <section className="section-shell">
        <ScrollReveal>
          <motion.div
            className="relative overflow-hidden rounded-2xl border border-primary/20 bg-foreground p-6 text-background md:grid md:grid-cols-[1fr_auto] md:gap-8 md:p-10"
            whileHover={{ scale: 1.005 }}
          >
            <motion.div
              className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/30 blur-3xl"
              animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative">
              <h2 className="text-3xl font-semibold md:text-4xl">
                Get the weekly AI stack investors and operators read.
              </h2>
              <p className="mt-3 max-w-2xl text-background/70">
                Launches, ranking shifts, creator signals, funding notes, and buyer-grade review summaries every Friday.
              </p>
            </div>
            <div className="relative mt-6 md:mt-0 md:self-end">
              <NewsletterActions />
            </div>
          </motion.div>
        </ScrollReveal>
      </section>

      <section className="section-shell pt-0">
        <StaggerReveal className="grid gap-4 md:grid-cols-3">
          {[
            [Users, "Buyer trust network", "Verified social accounts, role-based reviews, trust scoring, and fake-review detection."],
            [Quote, "Editorial-grade reviews", "User, creator, official, and verified social review types with AI summaries."],
            [Star, "Ranking engine", "Weighted by quality, recency, engagement, traffic, reviews, and creator reputation."]
          ].map(([Icon, title, body]) => {
            const DisplayIcon = Icon as typeof Users;
            return (
              <StaggerItem key={title as string}>
                <motion.div
                  className="h-full [perspective:800px]"
                  whileHover={{ rotateY: 6, rotateX: -4, y: -6 }}
                  transition={{ type: "spring", stiffness: 240, damping: 20 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <Card className="h-full border-primary/10 bg-gradient-to-br from-card to-card/60">
                    <CardContent className="p-5">
                      <motion.div
                        className="mb-4 inline-flex rounded-xl bg-primary/15 p-3"
                        whileHover={{ rotate: 8, scale: 1.08 }}
                      >
                        <DisplayIcon className="h-6 w-6 text-primary" />
                      </motion.div>
                      <h3 className="font-semibold">{title as string}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{body as string}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerReveal>
      </section>
    </>
  );
}

function SectionHeading({ eyebrow, title, actionHref, action }: { eyebrow: string; title: string; actionHref?: string; action?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <motion.p
          className="text-sm font-medium uppercase tracking-[0.18em] text-primary"
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          {eyebrow}
        </motion.p>
        <h2 className="mt-2 max-w-3xl text-3xl font-semibold tracking-normal md:text-4xl">{title}</h2>
      </div>
      {actionHref && action ? (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Button asChild variant="outline" className="hidden border-primary/30 sm:inline-flex">
            <Link href={actionHref}>
              {action}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      ) : null}
    </div>
  );
}
