import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { creators, reviews } from "@/data/catalog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const creator = creators.find((item) => item.handle === handle);
  return creator
    ? {
        title: `${creator.name} Creator Profile`,
        description: `${creator.name}'s AI reviews, reputation score, verified channels, and creator earnings on TheAiStack.`
      }
    : {};
}

export default async function UserProfilePage({ params }: Props) {
  const { handle } = await params;
  const creator = creators.find((item) => item.handle === handle);
  if (!creator) notFound();

  return (
    <div className="section-shell">
      <div className="mb-8 flex flex-wrap items-center gap-5">
        <Avatar className="h-20 w-20">
          <AvatarImage src={creator.avatarUrl} alt={creator.name} />
          <AvatarFallback>{creator.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-4xl font-semibold">{creator.name}</h1>
          <p className="text-muted-foreground">@{creator.handle} · {creator.niche}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {creator.verifiedChannels.map((channel) => (
              <Badge key={channel} variant="verified">{channel}</Badge>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Followers", creator.followers.toLocaleString()],
          ["Trust score", `${creator.trustScore}/100`],
          ["Monthly earnings", `$${creator.monthlyEarnings.toLocaleString()}`]
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <div className="mt-1 text-3xl font-semibold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-5">
              <Badge variant="secondary">{review.type}</Badge>
              <h2 className="mt-3 text-xl font-semibold">{review.title}</h2>
              <p className="mt-2 text-muted-foreground">{review.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
