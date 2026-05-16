"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { FounderEntitlementsView } from "@/types/founder";
import type { FounderManagedTool } from "@/lib/queries/tools";
import type { DashboardCopyVariant } from "@/lib/dashboard/copy";
import { getDashboardCopy } from "@/lib/dashboard/copy";
import { CREATE_CLAIM_SECTION_ID, scrollToCreateClaimSection } from "@/lib/founder/claim-section";
import { showErrorAlert, showErrorListAlert, showSuccessAlert, showUpgradeAlert } from "@/lib/ui/sweet-alert";
import { validateClaimForm, type ClaimFormValues } from "@/lib/validation/claim-form";
import "sweetalert2/dist/sweetalert2.min.css";
import { cn } from "@/lib/utils/cn";

function ClaimField({
  label,
  children,
  className
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-2 text-sm", className)}>
      <span className="font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

export function FounderListingManager({
  copyVariant = "user",
  section = "all",
  tools,
  entitlements
}: {
  copyVariant?: DashboardCopyVariant;
  section?: "all" | "create" | "list";
  tools: FounderManagedTool[];
  entitlements: FounderEntitlementsView;
}) {
  const copy = getDashboardCopy(copyVariant);
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
    promoVideoUrl: "",
    videoUrls: "",
    socialX: "",
    socialLinkedIn: "",
    socialYouTube: "",
    socialDiscord: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const claimSummary =
    entitlements.claimLimit === null
      ? `${entitlements.claimsUsed} claimed (unlimited plan)`
      : `${entitlements.claimsUsed} / ${entitlements.claimLimit} claims used`;

  useEffect(() => {
    if (section !== "all" && window.location.hash === `#${CREATE_CLAIM_SECTION_ID}`) {
      scrollToCreateClaimSection();
    }
  }, [section]);

  function updateField<K extends keyof ClaimFormValues>(key: K, value: ClaimFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function claimListing() {
    if (!entitlements.verified) {
      void showUpgradeAlert({ title: "Verification required", text: copy.notVerifiedClaimMessage });
      return;
    }

    if (!entitlements.canClaimMore) {
      void showUpgradeAlert({
        title: "Claim limit reached",
        text:
          entitlements.claimLimit === null
            ? "You cannot claim more listings on your current plan."
            : `Your ${entitlements.planName ?? "plan"} includes ${entitlements.claimLimit} claimed listing${entitlements.claimLimit === 1 ? "" : "s"}. Upgrade to claim more.`
      });
      return;
    }

    const validationErrors = validateClaimForm(form);
    if (validationErrors.length > 0) {
      void showErrorListAlert({ title: "Fix these fields", messages: validationErrors });
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
          void showUpgradeAlert({
            title: "Upgrade required",
            text: payload.error ?? "Upgrade your plan to claim more listings."
          });
          return;
        }

        const errorMessages =
          Array.isArray(payload.messages) && payload.messages.length > 0
            ? payload.messages
            : [payload.error ?? "Listing creation failed. Check your details and try again."];

        void showErrorListAlert({ title: "Could not create listing", messages: errorMessages });
        return;
      }

      void showSuccessAlert({
        title: "Listing created",
        text: payload.message ?? "Your claimed listing was created successfully."
      });
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
        promoVideoUrl: "",
        videoUrls: "",
        socialX: "",
        socialLinkedIn: "",
        socialYouTube: "",
        socialDiscord: ""
      });
      router.refresh();
    } catch {
      void showErrorAlert({ title: "Could not create listing", text: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {section === "create" ? (
        <div className="mb-6 border-b border-border/60 pb-4">
          <h2 className="text-xl font-semibold">Claim create</h2>
          <p className="mt-1 text-sm text-muted-foreground">Add a new tool listing to the directory.</p>
        </div>
      ) : null}

      {(section === "all" || section === "create") ? (
      <Card id={CREATE_CLAIM_SECTION_ID} className="scroll-mt-28 border-border/80 bg-card/50 shadow-none">
        <CardHeader>
          <CardTitle>Create claimed listing</CardTitle>
          <p className="text-sm text-muted-foreground">{claimSummary}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ClaimField label="Tool name">
              <Input onChange={(event) => updateField("name", event.target.value)} placeholder="e.g. Antigravity" value={form.name} />
            </ClaimField>
            <ClaimField label="Slug">
              <Input
                onChange={(event) => updateField("slug", event.target.value)}
                placeholder="e.g. clipnova (lowercase, hyphens only)"
                value={form.slug}
              />
            </ClaimField>
          </div>
          <ClaimField label="Short tagline">
            <Input onChange={(event) => updateField("tagline", event.target.value)} placeholder="One-line summary of your tool" value={form.tagline} />
          </ClaimField>
          <ClaimField label="Description">
            <Textarea
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="What it does, who it is for, and main workflow outcomes."
              rows={4}
              value={form.description}
            />
          </ClaimField>
          <div className="grid gap-4 md:grid-cols-2">
            <ClaimField label="Primary website link">
              <Input
                onChange={(event) => updateField("websiteUrl", event.target.value)}
                placeholder="https://yourproduct.com"
                type="url"
                value={form.websiteUrl}
              />
            </ClaimField>
            <ClaimField label="Affiliate link (optional)">
              <Input
                onChange={(event) => updateField("affiliateUrl", event.target.value)}
                placeholder="https://..."
                type="url"
                value={form.affiliateUrl}
              />
            </ClaimField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ClaimField label="Logo image URL">
              <Input
                onChange={(event) => updateField("logoUrl", event.target.value)}
                placeholder="https://.../logo.png"
                type="url"
                value={form.logoUrl}
              />
            </ClaimField>
            <ClaimField label="Categories">
              <Input
                onChange={(event) => updateField("categories", event.target.value)}
                placeholder="e.g. Productivity, AI agents"
                value={form.categories}
              />
            </ClaimField>
          </div>
          <ClaimField label="Key features">
            <Textarea
              onChange={(event) => updateField("features", event.target.value)}
              placeholder="Separate with commas or new lines"
              rows={3}
              value={form.features}
            />
          </ClaimField>
          <div className="grid gap-4 md:grid-cols-2">
            <ClaimField label="Pricing model">
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
            </ClaimField>
            <ClaimField label="Starting monthly price">
              <Input
                onChange={(event) => updateField("startingPrice", event.target.value)}
                min={0}
                placeholder="0"
                type="number"
                value={form.startingPrice}
              />
            </ClaimField>
          </div>
          <ClaimField label="Screenshot URLs">
            <Textarea
              onChange={(event) => updateField("screenshotUrls", event.target.value)}
              placeholder="One image URL per line"
              rows={3}
              value={form.screenshotUrls}
            />
          </ClaimField>
          <ClaimField label="Promo video link">
            <Input
              onChange={(event) => updateField("promoVideoUrl", event.target.value)}
              placeholder="YouTube or any video link (optional)"
              type="url"
              value={form.promoVideoUrl}
            />
          </ClaimField>
          <ClaimField label="Additional video links (optional)">
            <Textarea
              onChange={(event) => updateField("videoUrls", event.target.value)}
              placeholder="One link per line"
              rows={2}
              value={form.videoUrls}
            />
          </ClaimField>
          <div className="grid gap-4 md:grid-cols-2">
            <ClaimField label="X profile URL">
              <Input
                onChange={(event) => updateField("socialX", event.target.value)}
                placeholder="https://x.com/..."
                type="url"
                value={form.socialX}
              />
            </ClaimField>
            <ClaimField label="LinkedIn profile URL">
              <Input
                onChange={(event) => updateField("socialLinkedIn", event.target.value)}
                placeholder="https://linkedin.com/..."
                type="url"
                value={form.socialLinkedIn}
              />
            </ClaimField>
            <ClaimField label="YouTube channel URL">
              <Input
                onChange={(event) => updateField("socialYouTube", event.target.value)}
                placeholder="https://youtube.com/..."
                type="url"
                value={form.socialYouTube}
              />
            </ClaimField>
            <ClaimField label="Discord invite URL">
              <Input
                onChange={(event) => updateField("socialDiscord", event.target.value)}
                placeholder="https://discord.gg/..."
                type="url"
                value={form.socialDiscord}
              />
            </ClaimField>
          </div>
          <Button disabled={isSubmitting} onClick={claimListing}>
            {isSubmitting ? "Creating..." : "Create claimed listing"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Validation messages appear in a popup when required fields are missing or invalid.
          </p>
        </CardContent>
      </Card>
      ) : null}

      {(section === "all" || section === "list") ? (
        <div className="grid gap-4">
          {section === "list" ? (
            <div className="mb-2">
              <h2 className="text-xl font-semibold">Your claimed listings</h2>
              <p className="mt-1 text-sm text-muted-foreground">{claimSummary}</p>
            </div>
          ) : null}
          {tools.length ? (
            tools.map((tool) => <ManagedToolCard key={tool.id} copyVariant={copyVariant} tool={tool} />)
          ) : (
            <Card className="border-border/80 bg-card/50 shadow-none">
              <CardContent className="p-5 text-sm text-muted-foreground">{copy.emptyListings}</CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ManagedToolCard({ copyVariant = "user", tool }: { copyVariant?: DashboardCopyVariant; tool: FounderManagedTool }) {
  const copy = getDashboardCopy(copyVariant);
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
    setStatus(copy.publishingUpdate);

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
        setStatus(payload.error ?? copy.updateFailed);
        return;
      }

      setStatus(payload.message ?? copy.updatePublished);
      setUpdateTitle("");
      setUpdateBody("");
      router.refresh();
    } catch {
      setStatus(copy.updateFailed);
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
              {copy.publishUpdateLabel}
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
