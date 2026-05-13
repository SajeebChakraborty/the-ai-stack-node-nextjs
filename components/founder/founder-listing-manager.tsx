"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { FounderManagedTool } from "@/lib/queries/tools";

export function FounderListingManager({ tools }: { tools: FounderManagedTool[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [categories, setCategories] = useState("");
  const [features, setFeatures] = useState("");
  const [pricingModel, setPricingModel] = useState<"free" | "freemium" | "paid" | "usage-based" | "enterprise">("freemium");
  const [startingPrice, setStartingPrice] = useState("0");
  const [screenshotUrls, setScreenshotUrls] = useState("");
  const [videoUrls, setVideoUrls] = useState("");
  const [socialX, setSocialX] = useState("");
  const [socialLinkedIn, setSocialLinkedIn] = useState("");
  const [socialYouTube, setSocialYouTube] = useState("");
  const [socialDiscord, setSocialDiscord] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function claimListing() {
    setIsSubmitting(true);
    setStatus("Creating claimed listing...");

    try {
      const response = await fetch("/api/founder/tools/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          slug: slug.trim().toLowerCase(),
          tagline,
          description,
          websiteUrl,
          affiliateUrl,
          logoUrl,
          categories,
          features,
          pricingModel,
          startingPrice,
          screenshotUrls,
          videoUrls,
          socialX,
          socialLinkedIn,
          socialYouTube,
          socialDiscord
        })
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setStatus(payload.error ?? "Listing creation failed.");
        return;
      }

      setStatus(payload.message ?? "Listing created.");
      setName("");
      setSlug("");
      setTagline("");
      setDescription("");
      setWebsiteUrl("");
      setAffiliateUrl("");
      setLogoUrl("");
      setCategories("");
      setFeatures("");
      setPricingModel("freemium");
      setStartingPrice("0");
      setScreenshotUrls("");
      setVideoUrls("");
      setSocialX("");
      setSocialLinkedIn("");
      setSocialYouTube("");
      setSocialDiscord("");
      router.refresh();
    } catch {
      setStatus("Listing creation failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create claimed listing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Input onChange={(event) => setName(event.target.value)} placeholder="Tool name" value={name} />
            <Input onChange={(event) => setSlug(event.target.value)} placeholder="Slug, for example clipnova" value={slug} />
          </div>
          <Input onChange={(event) => setTagline(event.target.value)} placeholder="Short tagline" value={tagline} />
          <Textarea onChange={(event) => setDescription(event.target.value)} placeholder="Describe what this tool does, who it is for, and the main workflow outcomes." value={description} />
          <div className="grid gap-3 md:grid-cols-2">
            <Input onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="Primary redirect / website link" value={websiteUrl} />
            <Input onChange={(event) => setAffiliateUrl(event.target.value)} placeholder="Optional affiliate / redirect link" value={affiliateUrl} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input onChange={(event) => setLogoUrl(event.target.value)} placeholder="Logo image URL" value={logoUrl} />
            <Input onChange={(event) => setCategories(event.target.value)} placeholder="Categories, separated by commas" value={categories} />
          </div>
          <Textarea onChange={(event) => setFeatures(event.target.value)} placeholder="Key features, separated by commas or new lines" value={features} />
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-muted-foreground">
              <span>Pricing model</span>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" onChange={(event) => setPricingModel(event.target.value as typeof pricingModel)} value={pricingModel}>
                <option value="free">Free</option>
                <option value="freemium">Freemium</option>
                <option value="paid">Paid</option>
                <option value="usage-based">Usage based</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </label>
            <Input onChange={(event) => setStartingPrice(event.target.value)} placeholder="Starting monthly price" type="number" value={startingPrice} />
          </div>
          <Textarea onChange={(event) => setScreenshotUrls(event.target.value)} placeholder="Screenshot URLs, separated by new lines" value={screenshotUrls} />
          <Textarea onChange={(event) => setVideoUrls(event.target.value)} placeholder="YouTube or embed video links, separated by new lines" value={videoUrls} />
          <div className="grid gap-3 md:grid-cols-2">
            <Input onChange={(event) => setSocialX(event.target.value)} placeholder="X profile URL" value={socialX} />
            <Input onChange={(event) => setSocialLinkedIn(event.target.value)} placeholder="LinkedIn profile URL" value={socialLinkedIn} />
            <Input onChange={(event) => setSocialYouTube(event.target.value)} placeholder="YouTube channel URL" value={socialYouTube} />
            <Input onChange={(event) => setSocialDiscord(event.target.value)} placeholder="Discord invite URL" value={socialDiscord} />
          </div>
          <Button disabled={isSubmitting} onClick={claimListing}>
            {isSubmitting ? "Creating..." : "Create claimed listing"}
          </Button>
          <p className="text-sm text-muted-foreground">This creates a new founder-owned listing. Tool page videos, screenshots, links, and updates will come from the data submitted here and from the manager below.</p>
          {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {tools.length ? (
          tools.map((tool) => <ManagedToolCard key={tool.id} tool={tool} />)
        ) : (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">No listings are claimed on this founder account yet.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ManagedToolCard({ tool }: { tool: FounderManagedTool }) {
  const router = useRouter();
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateBody, setUpdateBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAltText, setImageAltText] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitFounderUpdate() {
    setIsSubmitting(true);
    setStatus("Publishing founder update...");

    try {
      const response = await fetch(`/api/founder/tools/${tool.id}/updates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: updateTitle,
          body: updateBody
        })
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setStatus(payload.error ?? "Founder update failed.");
        return;
      }

      setStatus(payload.message ?? "Founder update published.");
      setUpdateTitle("");
      setUpdateBody("");
      router.refresh();
    } catch {
      setStatus("Founder update failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function addImage() {
    setIsSubmitting(true);
    setStatus("Adding screenshot...");

    try {
      const response = await fetch(`/api/founder/tools/${tool.id}/media`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          kind: "image",
          url: imageUrl,
          altText: imageAltText
        })
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setStatus(payload.error ?? "Screenshot upload failed.");
        return;
      }

      setStatus(payload.message ?? "Screenshot added.");
      setImageUrl("");
      setImageAltText("");
      router.refresh();
    } catch {
      setStatus("Screenshot upload failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function addVideo() {
    setIsSubmitting(true);
    setStatus("Adding video...");

    try {
      const response = await fetch(`/api/founder/tools/${tool.id}/media`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          kind: "video",
          title: videoTitle,
          url: videoUrl,
          duration: videoDuration
        })
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setStatus(payload.error ?? "Video publish failed.");
        return;
      }

      setStatus(payload.message ?? "Video added.");
      setVideoTitle("");
      setVideoUrl("");
      setVideoDuration("");
      router.refresh();
    } catch {
      setStatus("Video publish failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tool.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{tool.categories.join(", ")} · {tool.mediaCount} media items · {tool.updateCount} updates</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="updates">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="updates">Updates</TabsTrigger>
            <TabsTrigger value="images">Screenshots</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
          </TabsList>
          <TabsContent value="updates" className="space-y-3">
            <Input onChange={(event) => setUpdateTitle(event.target.value)} placeholder="Update title" value={updateTitle} />
            <Textarea onChange={(event) => setUpdateBody(event.target.value)} placeholder="Explain what changed, why it matters, and who should care." value={updateBody} />
            <Button disabled={isSubmitting} onClick={submitFounderUpdate}>
              Publish founder update
            </Button>
          </TabsContent>
          <TabsContent value="images" className="space-y-3">
            <Input onChange={(event) => setImageUrl(event.target.value)} placeholder="Screenshot URL" value={imageUrl} />
            <Input onChange={(event) => setImageAltText(event.target.value)} placeholder="Screenshot alt text" value={imageAltText} />
            <Button disabled={isSubmitting} onClick={addImage}>
              Add screenshot
            </Button>
          </TabsContent>
          <TabsContent value="videos" className="space-y-3">
            <Input onChange={(event) => setVideoTitle(event.target.value)} placeholder="Video title" value={videoTitle} />
            <Input onChange={(event) => setVideoUrl(event.target.value)} placeholder="Embed URL, for example https://www.youtube.com/embed/..." value={videoUrl} />
            <Input onChange={(event) => setVideoDuration(event.target.value)} placeholder="Duration, for example 5:39" value={videoDuration} />
            <Button disabled={isSubmitting} onClick={addVideo}>
              Add video
            </Button>
          </TabsContent>
        </Tabs>
        {status ? <p className="mt-3 text-sm text-muted-foreground">{status}</p> : null}
      </CardContent>
    </Card>
  );
}
