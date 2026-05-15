"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClaimFeedbackDialog } from "@/components/founder/claim-feedback-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { FounderEntitlementsView } from "@/types/founder";
import type { FounderManagedTool } from "@/lib/queries/tools";
import { CREATE_CLAIM_SECTION_ID, scrollToCreateClaimSection } from "@/lib/founder/claim-section";
import { validateClaimForm, type ClaimFormValues } from "@/lib/validation/claim-form";

export function FounderListingManager({
  tools,
  entitlements
}: {
  tools: FounderManagedTool[];
  entitlements: FounderEntitlementsView;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ClaimFormValues>({
    name: "",
    slug: "",
    tagline: "",
    description: "",
    websiteUrl: "",
    affiliateUrl: "",
    logoUrl: "",
    categories: "",
    features: "",
    pricingModel: "freemium",
    startingPrice: "0",
    screenshotUrls: "",
    videoUrls: "",
    socialX: "",
    socialLinkedIn: "",
    socialYouTube: "",
    socialDiscord: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("Check your listing details");
  const [dialogMessages, setDialogMessages] = useState<string[]>([]);
  const [dialogVariant, setDialogVariant] = useState<"validation" | "upgrade" | "success">("validation");

  const claimSummary =
    entitlements.claimLimit === null
      ? `${entitlements.claimsUsed} claimed (unlimited plan)`
      : `${entitlements.claimsUsed} / ${entitlements.claimLimit} claims used`;

  useEffect(() => {
    if (window.location.hash === `#${CREATE_CLAIM_SECTION_ID}`) {
      scrollToCreateClaimSection();
    }
  }, []);

  function showDialog(title: string, messages: string[], variant: "validation" | "upgrade" | "success") {
    setDialogTitle(title);
    setDialogMessages(messages);
    setDialogVariant(variant);
    setDialogOpen(true);
  }

  function updateField<K extends keyof ClaimFormValues>(key: K, value: ClaimFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function claimListing() {
    if (!entitlements.verified) {
      showDialog(
        "Verification required",
        ["Complete a founder plan payment to become verified before claiming listings."],
        "upgrade"
      );
      return;
    }

    if (!entitlements.canClaimMore) {
      showDialog(
        "Claim limit reached",
        [
          entitlements.claimLimit === null
            ? "You cannot claim more listings on your current plan."
            : `Your ${entitlements.planName ?? "plan"} includes ${entitlements.claimLimit} claimed listing${entitlements.claimLimit === 1 ? "" : "s"}. Upgrade to claim more.`
        ],
        "upgrade"
      );
      return;
    }

    const validationErrors = validateClaimForm(form);
    if (validationErrors.length > 0) {
      showDialog("Fix these fields", validationErrors, "validation");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/founder/tools/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          slug: form.slug.trim().toLowerCase()
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        code?: string;
        messages?: string[];
      };
      if (!response.ok) {
        if (payload.code === "CLAIM_LIMIT_REACHED" || payload.code === "NOT_VERIFIED") {
          showDialog("Upgrade required", [payload.error ?? "Upgrade your plan to claim more listings."], "upgrade");
          return;
        }

        const errorMessages =
          Array.isArray(payload.messages) && payload.messages.length > 0
            ? payload.messages
            : [payload.error ?? "Listing creation failed. Check your details and try again."];

        showDialog("Could not create listing", errorMessages, "validation");
        return;
      }

      showDialog("Listing created", [payload.message ?? "Your claimed listing was created successfully."], "success");
      setForm({
        name: "",
        slug: "",
        tagline: "",
        description: "",
        websiteUrl: "",
        affiliateUrl: "",
        logoUrl: "",
        categories: "",
        features: "",
        pricingModel: "freemium",
        startingPrice: "0",
        screenshotUrls: "",
        videoUrls: "",
        socialX: "",
        socialLinkedIn: "",
        socialYouTube: "",
        socialDiscord: ""
      });
      router.refresh();
    } catch {
      showDialog("Could not create listing", ["Something went wrong. Please try again."], "validation");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <ClaimFeedbackDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={dialogTitle}
        messages={dialogMessages}
        variant={dialogVariant}
      />
      <Card id={CREATE_CLAIM_SECTION_ID} className="scroll-mt-28">
        <CardHeader>
          <CardTitle>Create claimed listing</CardTitle>
          <p className="text-sm text-muted-foreground">{claimSummary}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Input onChange={(event) => updateField("name", event.target.value)} placeholder="Tool name" value={form.name} />
            <Input onChange={(event) => updateField("slug", event.target.value)} placeholder="Slug, for example clipnova" value={form.slug} />
          </div>
          <Input onChange={(event) => updateField("tagline", event.target.value)} placeholder="Short tagline" value={form.tagline} />
          <Textarea
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Describe what this tool does, who it is for, and the main workflow outcomes."
            value={form.description}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Input onChange={(event) => updateField("websiteUrl", event.target.value)} placeholder="Primary redirect / website link" value={form.websiteUrl} />
            <Input onChange={(event) => updateField("affiliateUrl", event.target.value)} placeholder="Optional affiliate / redirect link" value={form.affiliateUrl} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input onChange={(event) => updateField("logoUrl", event.target.value)} placeholder="Logo image URL" value={form.logoUrl} />
            <Input onChange={(event) => updateField("categories", event.target.value)} placeholder="Categories, separated by commas" value={form.categories} />
          </div>
          <Textarea onChange={(event) => updateField("features", event.target.value)} placeholder="Key features, separated by commas or new lines" value={form.features} />
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-muted-foreground">
              <span>Pricing model</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                onChange={(event) => updateField("pricingModel", event.target.value)}
                value={form.pricingModel}
              >
                <option value="free">Free</option>
                <option value="freemium">Freemium</option>
                <option value="paid">Paid</option>
                <option value="usage-based">Usage based</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </label>
            <Input
              onChange={(event) => updateField("startingPrice", event.target.value)}
              placeholder="Starting monthly price"
              type="number"
              value={form.startingPrice}
            />
          </div>
          <Textarea onChange={(event) => updateField("screenshotUrls", event.target.value)} placeholder="Screenshot URLs, separated by new lines" value={form.screenshotUrls} />
          <Textarea onChange={(event) => updateField("videoUrls", event.target.value)} placeholder="YouTube or embed video links, separated by new lines" value={form.videoUrls} />
          <div className="grid gap-3 md:grid-cols-2">
            <Input onChange={(event) => updateField("socialX", event.target.value)} placeholder="X profile URL" value={form.socialX} />
            <Input onChange={(event) => updateField("socialLinkedIn", event.target.value)} placeholder="LinkedIn profile URL" value={form.socialLinkedIn} />
            <Input onChange={(event) => updateField("socialYouTube", event.target.value)} placeholder="YouTube channel URL" value={form.socialYouTube} />
            <Input onChange={(event) => updateField("socialDiscord", event.target.value)} placeholder="Discord invite URL" value={form.socialDiscord} />
          </div>
          <Button disabled={isSubmitting} onClick={claimListing}>
            {isSubmitting ? "Creating..." : "Create claimed listing"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Validation messages appear in a popup when required fields are missing or invalid.
          </p>
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
        <p className="text-sm text-muted-foreground">
          {tool.categories.join(", ")} · {tool.mediaCount} media items · {tool.updateCount} updates
        </p>
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
