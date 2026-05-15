import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/account/profile-form";
import { requireUser } from "@/lib/auth/session";
import { getEditableProfile } from "@/lib/queries/profile";

export const metadata: Metadata = {
  title: "Admin Profile",
  description: "Edit your admin profile."
};

export default async function AdminProfilePage() {
  const user = await requireUser("/admin/profile", ["admin"]);
  const profile = await getEditableProfile(user.id);

  if (!profile) {
    redirect("/auth/admin/login");
  }

  return (
    <div className="px-4 py-6 md:px-8">
      <ProfileForm profile={profile} />
    </div>
  );
}
