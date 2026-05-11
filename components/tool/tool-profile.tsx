import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, MessageSquare, PlayCircle, ShieldCheck, Star, ThumbsUp } from "lucide-react";
import type { Review, Tool } from "@/types/domain";
import { toolJsonLd } from "@/lib/seo/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToolActions } from "@/components/tool/tool-actions";
import { ReviewForm } from "@/components/tool/review-form";

export function ToolProfile({ tool, toolReviews, alternatives }: { tool: Tool; toolReviews: Review[]; alternatives: Tool[] }) {
  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd(tool)) }} />
      <section className="border-b bg-secondary/30">
        <div className="container grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-start gap-4">
              <Image src={tool.logoUrl} alt={`${tool.name} logo`} width={88} height={88} className="h-[88px] w-[88px] rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h1 className="text-4xl font-semibold tracking-normal">{tool.name}</h1>
                  {tool.verified ? (
                    <Badge variant="verified">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Verified listing
                    </Badge>
                  ) : null}
                </div>
                <p className="max-w-3xl text-lg text-muted-foreground">{tool.tagline}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {tool.categories.map((category) => (
                <Link key={category} href={`/categories/${category.toLowerCase()}`}>
                  <Badge variant="secondary">{category}</Badge>
                </Link>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                ["Rating", tool.rating],
                ["Reviews", tool.reviewCount],
                ["Trust", `${tool.trustScore}/100`],
                ["Growth", `+${tool.growthRate}%`]
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border bg-background p-4">
                  <div className="text-2xl font-semibold">{value}</div>
                  <div className="text-sm text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <Card>
            <CardContent className="grid gap-4 p-5">
              <ToolActions tool={tool} />
              <div className="rounded-md bg-secondary/50 p-4 text-sm">
                <div className="font-semibold">Pricing</div>
                <div className="text-muted-foreground">
                  {tool.pricingModel} · starts at ${tool.startingPrice}/month
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-md border p-3">
                <Avatar>
                  <AvatarImage src={tool.founder.avatarUrl} alt={tool.founder.name} />
                  <AvatarFallback>{tool.founder.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{tool.founder.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {tool.founder.title} · {tool.founder.companyStage}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="section-shell">
        <Tabs defaultValue="overview">
          <TabsList className="flex h-auto flex-wrap justify-start">
            {["Overview", "Reviews", "Videos", "Alternatives", "Discussions", "Updates"].map((tab) => (
              <TabsTrigger key={tab} value={tab.toLowerCase()}>
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>What {tool.name} does</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{tool.description}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {tool.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 rounded-md border p-3 text-sm">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <div className="grid gap-4 sm:grid-cols-2">
                  {tool.screenshots.map((screenshot) => (
                    <Image key={screenshot} src={screenshot} alt={`${tool.name} screenshot`} width={700} height={420} className="aspect-video rounded-lg border object-cover" />
                  ))}
                </div>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>AI review summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    Reviewers praise {tool.name} for clear onboarding, measurable workflow gains, and credible founder engagement. The most common buyer fit is{" "}
                    {tool.categories.slice(0, 2).join(" and ")} teams evaluating tools with proof requirements.
                  </p>
                  <div className="rounded-md border bg-secondary/40 p-3">
                    Fake-review risk: <span className="font-semibold text-emerald-500">Low</span>. Signals include verified social accounts, natural review velocity, and consistent buyer context.
                  </div>
                  <div className="space-y-2">
                    {tool.faqs.map((faq) => (
                      <div key={faq.question}>
                        <div className="font-medium text-foreground">{faq.question}</div>
                        <div>{faq.answer}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="reviews">
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                {toolReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Write a review</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewForm toolName={tool.name} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="videos">
            <div className="grid gap-4 md:grid-cols-2">
              {tool.videos.map((video) => (
                <Card key={video.title} className="overflow-hidden">
                  <div className="aspect-video bg-secondary">
                    <iframe title={video.title} src={video.embedUrl} className="h-full w-full" allowFullScreen />
                  </div>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="font-medium">{video.title}</div>
                    <Badge variant="secondary">
                      <PlayCircle className="mr-1 h-3 w-3" />
                      {video.duration}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="alternatives">
            <div className="grid gap-4 md:grid-cols-3">
              {alternatives.map((alternative) => (
                <Card key={alternative.id}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{alternative.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{alternative.tagline}</p>
                    <Button asChild variant="outline" size="sm" className="mt-4">
                      <Link href={`/tools/${alternative.slug}`}>Compare</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="discussions">
            <Card>
              <CardContent className="space-y-4 p-5">
                {["Best implementation workflow?", "How does pricing scale for larger teams?", "Share migration notes from legacy tools"].map((topic, index) => (
                  <div key={topic} className="flex items-center justify-between rounded-md border p-4">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">{topic}</div>
                        <div className="text-xs text-muted-foreground">{18 - index * 4} nested comments · moderated</div>
                      </div>
                    </div>
                    <Badge variant="secondary">{128 - index * 31} votes</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="updates">
            <Card>
              <CardContent className="space-y-4 p-5">
                {["SOC 2 dashboard export shipped", "Founder AMA scheduled", "New affiliate campaign approved"].map((update, index) => (
                  <div key={update} className="rounded-md border p-4">
                    <div className="font-medium">{update}</div>
                    <div className="text-sm text-muted-foreground">{index + 2} days ago by {tool.founder.name}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={review.authorAvatar} alt={review.author} />
              <AvatarFallback>{review.author.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{review.author}</div>
              <div className="text-xs text-muted-foreground">
                {review.type} · trust {review.trustScore}/100
              </div>
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
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ThumbsUp className="h-4 w-4" />
          {review.helpful} people found this helpful
        </div>
      </CardContent>
    </Card>
  );
}
