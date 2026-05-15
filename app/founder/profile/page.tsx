import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/account/profile-form";
import { requireUser } from "@/lib/auth/session";
import { getEditableProfile } from "@/lib/queries/profile";

export const metadata: Metadata = {
  title: "Founder Profile",
  description: "Edit your founder profile."
};

export default async function FounderProfilePage() {
  const user = await requireUser("/founder/profile", ["founder"]);
  const profile = await getEditableProfile(user.id);

  if (!profile) {
    redirect("/auth/founder/login");
  }

  return (
    <div className="section-shell">
      <ProfileForm profile={profile} />
    </div>
  );
}
