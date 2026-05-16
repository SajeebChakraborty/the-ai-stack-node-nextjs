import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/account/profile-form";
import { requireUser } from "@/lib/auth/session";
import { getEditableProfile } from "@/lib/queries/profile";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Edit your member profile."
};

export default async function AccountProfilePage() {
  const user = await requireUser("/account/profile", ["user", "creator", "moderator", "founder"]);
  const profile = await getEditableProfile(user.id);

  if (!profile) {
    redirect("/auth/login");
  }

  return (
    <div className="section-shell">
      <ProfileForm profile={profile} />
    </div>
  );
}
