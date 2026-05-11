import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Newspaper, PlayCircle, Quote, Rocket, Star, Trophy, Users } from "lucide-react";
import { creators, news, reviews, tools } from "@/data/catalog";
import { sortTools } from "@/lib/utils/ranking";
import { ToolCard } from "@/components/directory/tool-card";
import { NewsletterActions } from "@/components/home/newsletter-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HomeSections() {
  const trending = sortTools(tools, "trending");
  const topRated = sortTools(tools, "top-rated");
  const latest = sortTools(tools, "newest");

  return (
    <>
      <section className="section-shell">
        <SectionHeading eyebrow="Directory" title="Trending AI tools" actionHref="/directory" action="View directory" />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trending.slice(0, 3).map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      <section className="border-y bg-secondary/30">
        <div className="section-shell grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading eyebrow="Featured" title="Editor-picked market leaders" />
            <div className="mt-6 grid gap-4">
              {topRated.slice(0, 2).map((tool) => (
                <Card key={tool.id} className="overflow-hidden">
                  <CardContent className="flex gap-4 p-4">
                    <Image src={tool.screenshots[0]} alt={`${tool.name} screenshot`} width={220} height={140} className="hidden aspect-video w-48 rounded-md object-cover sm:block" />
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
              ))}
            </div>
          </div>
          <div>
            <SectionHeading eyebrow="Creator spotlight" title="Trusted reviewers drive better discovery" />
            <div className="mt-6 grid gap-4">
              {creators.map((creator) => (
                <Card key={creator.id}>
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={creator.avatarUrl} alt={creator.name} />
                        <AvatarFallback>{creator.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{creator.name}</div>
                        <div className="text-sm text-muted-foreground">{creator.niche}</div>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold">{creator.trustScore}/100</div>
                      <div className="text-muted-foreground">trust</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <SectionHeading eyebrow="Reviews" title="Featured proof from verified buyers and creators" />
          <div className="mt-6 grid gap-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-5">
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
                        <Star key={index} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <h3 className="font-semibold">{review.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{review.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div className="grid gap-4">
          <SectionHeading eyebrow="Media network" title="AI news and launch intelligence" />
          {news.map((article) => (
            <Card key={article.id}>
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
          ))}
        </div>
      </section>

      <section className="border-y bg-secondary/30">
        <div className="section-shell">
          <SectionHeading eyebrow="Launches" title="Latest launches with founder video, reviews, and traction" />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {latest.slice(0, 3).map((tool) => (
              <Card key={tool.id} className="overflow-hidden">
                <Image src={tool.screenshots[0]} alt={`${tool.name} launch`} width={500} height={300} className="aspect-video w-full object-cover" />
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
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="grid gap-6 rounded-lg border bg-foreground p-6 text-background md:grid-cols-[1fr_auto] md:p-8">
          <div>
            <h2 className="text-3xl font-semibold">Get the weekly AI stack investors and operators read.</h2>
            <p className="mt-2 max-w-2xl text-background/70">Launches, ranking shifts, creator signals, funding notes, and buyer-grade review summaries every Friday.</p>
          </div>
          <NewsletterActions />
        </div>
      </section>

      <section className="section-shell pt-0">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [Users, "Buyer trust network", "Verified social accounts, role-based reviews, trust scoring, and fake-review detection."],
            [Quote, "Editorial-grade reviews", "User, creator, official, and verified social review types with AI summaries."],
            [Star, "Ranking engine", "Weighted by quality, recency, engagement, traffic, reviews, and creator reputation."]
          ].map(([Icon, title, body]) => {
            const DisplayIcon = Icon as typeof Users;
            return (
              <Card key={title as string}>
                <CardContent className="p-5">
                  <DisplayIcon className="mb-4 h-6 w-6 text-primary" />
                  <h3 className="font-semibold">{title as string}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{body as string}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </>
  );
}

function SectionHeading({ eyebrow, title, actionHref, action }: { eyebrow: string; title: string; actionHref?: string; action?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <h2 className="mt-2 max-w-3xl text-3xl font-semibold tracking-normal md:text-4xl">{title}</h2>
      </div>
      {actionHref && action ? (
        <Button asChild variant="outline" className="hidden sm:inline-flex">
          <Link href={actionHref}>
            {action}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
