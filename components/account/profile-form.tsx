"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Role } from "@/types/domain";
import { canUseMemberDashboard } from "@/lib/auth/member-roles";
import { getHomeForRole } from "@/lib/auth/portals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type EditableProfile = {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  handle: string;
  bio: string;
  location: string;
  websiteUrl: string;
  avatarUrl: string;
  companyName: string;
  title: string;
  niche: string;
};

export function ProfileForm({ profile }: { profile: EditableProfile }) {
  const router = useRouter();
  const [form, setForm] = useState(profile);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const dashboardPath = getHomeForRole(profile.role);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = (await response.json()) as { error?: string; message?: string; profile?: EditableProfile };

      if (!response.ok) {
        setError(payload.error ?? "Profile update failed.");
        return;
      }

      if (payload.profile) {
        setForm(payload.profile);
      }

      setStatus(payload.message ?? "Profile saved.");
      router.refresh();
    } catch {
      setError("Profile update failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Edit profile</CardTitle>
        <p className="text-sm text-muted-foreground">
          {profile.email} · <span className="capitalize">{profile.role}</span>
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Full name</span>
            <Input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Handle</span>
            <Input value={form.handle} onChange={(event) => setForm({ ...form, handle: event.target.value })} placeholder="your-handle" />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Bio</span>
            <Textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows={4} />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Location</span>
            <Input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Website</span>
            <Input value={form.websiteUrl} onChange={(event) => setForm({ ...form, websiteUrl: event.target.value })} type="url" />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Avatar URL</span>
            <Input value={form.avatarUrl} onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })} type="url" />
          </label>
          {canUseMemberDashboard(profile.role) ? (
            <>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Company name</span>
                <Input value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Title</span>
                <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </label>
            </>
          ) : null}
          {/* {profile.role === "founder" ? ( ... founder-only fields ... ) : null} */}
          {profile.role === "creator" ? (
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Niche</span>
              <Input value={form.niche} onChange={(event) => setForm({ ...form, niche: event.target.value })} />
            </label>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {status ? <p className="text-sm text-green-600 dark:text-green-400">{status}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : "Save profile"}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href={dashboardPath}>Back to dashboard</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
