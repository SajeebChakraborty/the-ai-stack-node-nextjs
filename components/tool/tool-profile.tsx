import Link from "next/link";
import { CheckCircle2, MessageSquare, PlayCircle, ShieldCheck, Star, ThumbsUp } from "lucide-react";
import type { Review, Tool } from "@/types/domain";
import type { ToolDiscussion, ToolUpdateItem } from "@/lib/queries/tools";
import { buildToolReviewSummary } from "@/lib/tools/review-summary";
import { breadcrumbJsonLd, toolJsonLd } from "@/lib/seo/schema";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToolProfileViewTracker } from "@/components/analytics/tool-profile-view-tracker";
import { RemoteImage } from "@/components/ui/remote-image";
import { ToolLogo } from "@/components/ui/tool-logo";
import { ToolActions } from "@/components/tool/tool-actions";
import { ReviewForm } from "@/components/tool/review-form";
import { DiscussionForm } from "@/components/tool/discussion-form";
import { DiscussionVoteButtons } from "@/components/tool/discussion-vote-buttons";

const fakeReviewToneClass = {
  low: "text-emerald-500",
  medium: "text-amber-500",
  elevated: "text-rose-400"
} as const;

export function ToolProfile({
  alternatives,
  communityBlockedReason,
  discussions,
  tool,
  toolReviews,
  updates
}: {
  alternatives: Tool[];
  communityBlockedReason?: string;
  discussions: ToolDiscussion[];
  tool: Tool;
  toolReviews: Review[];
  updates: ToolUpdateItem[];
}) {
  const reviewSummary = buildToolReviewSummary(tool, toolReviews);

  return (
    <>
      <ToolProfileViewTracker toolId={tool.id} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd(tool)) }} />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Directory", path: "/directory" },
              { name: tool.name, path: `/tools/${tool.slug}` }
            ])
          )
        }}
      />
      <div className="container py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/directory">Directory</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{tool.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <section className="border-b bg-secondary/30">
        <div className="container grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-start gap-4">
              <ToolLogo src={tool.logoUrl} alt={`${tool.name} logo`} width={88} height={88} className="h-[88px] w-[88px] rounded-lg object-cover" />
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
                ["Rating", tool.reviewCount ? tool.rating.toFixed(1) : "—"],
                ["Reviews", tool.reviewCount],
                ["Trust", `${tool.trustScore}/100`],
                ["Growth", `${tool.growthRate >= 0 ? "+" : ""}${tool.growthRate}%`]
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
                    {tool.features.length ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {tool.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2 rounded-md border p-3 text-sm">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">The founder has not added product features yet.</p>
                    )}
                  </CardContent>
                </Card>
                <div className="grid gap-4 sm:grid-cols-2">
                  {tool.screenshots.map((screenshot) => (
                    <RemoteImage
                      key={screenshot}
                      src={screenshot}
                      alt={`${tool.name} screenshot`}
                      width={700}
                      height={420}
                      className="aspect-video rounded-lg border object-cover"
                    />
                  ))}
                </div>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>AI review summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>{reviewSummary.summary}</p>
                  {reviewSummary.highlights.map((highlight) => (
                    <p key={highlight}>{highlight}</p>
                  ))}
                  <div className="rounded-md border bg-secondary/40 p-3">
                    Fake-review risk:{" "}
                    <span className={`font-semibold ${fakeReviewToneClass[reviewSummary.fakeReviewTone]}`}>{reviewSummary.fakeReviewLabel}</span>
                    . Based on live review count, verified reviewer share, and listing verification status.
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
                {toolReviews.length ? toolReviews.map((review) => <ReviewCard key={review.id} review={review} />) : <EmptyStateCard message="No community reviews yet. The first review should come from a user or another founder, not the listing owner." title="No reviews yet" />}
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Write a review</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewForm blockedReason={communityBlockedReason} toolSlug={tool.slug} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="videos">
            {tool.videos.length ? (
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
            ) : (
              <EmptyStateCard message="The claiming founder has not attached product videos yet." title="No videos yet" />
            )}
          </TabsContent>
          <TabsContent value="alternatives">
            {alternatives.length ? (
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
            ) : (
              <EmptyStateCard message="Alternatives will appear here after other founders claim listings in the same category." title="No claimed alternatives yet" />
            )}
          </TabsContent>
          <TabsContent value="discussions">
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                {discussions.length ? (
                  discussions.map((discussion) => (
                    <Card key={discussion.id}>
                      <CardContent className="space-y-4 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <MessageSquare className="mt-1 h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium">{discussion.title}</div>
                              <div className="mt-1 text-sm text-muted-foreground">{discussion.body}</div>
                              <div className="mt-2 text-xs text-muted-foreground">
                                {discussion.authorName} · {discussion.authorRole} · {discussion.commentCount} comments
                              </div>
                            </div>
                          </div>
                        </div>
                        <DiscussionVoteButtons blockedReason={communityBlockedReason} discussionId={discussion.id} voteScore={discussion.voteScore} />
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <EmptyStateCard message="Discussions open up once users and other founders begin asking implementation and pricing questions." title="No discussions yet" />
                )}
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Start a discussion</CardTitle>
                </CardHeader>
                <CardContent>
                  <DiscussionForm blockedReason={communityBlockedReason} toolSlug={tool.slug} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="updates">
            {updates.length ? (
              <Card>
                <CardContent className="space-y-4 p-5">
                  {updates.map((update) => (
                    <div key={update.id} className="rounded-md border p-4">
                      <div className="font-medium">{update.title}</div>
                      <div className="mt-2 text-sm text-muted-foreground">{update.body}</div>
                      <div className="mt-3 text-xs text-muted-foreground">
                        {formatRelativeDate(update.publishedAt ?? update.createdAt)} by {update.authorName}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <EmptyStateCard message="Founder updates appear here after the claiming founder publishes release notes, launch notes, and roadmap news." title="No founder updates yet" />
            )}
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

function EmptyStateCard({ message, title }: { message: string; title: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="font-medium">{title}</div>
        <div className="mt-2 text-sm text-muted-foreground">{message}</div>
      </CardContent>
    </Card>
  );
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
