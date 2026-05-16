import { redirect } from "next/navigation";

/** Legacy founder profile URL — unified member profile at /account/profile. */
export default function FounderProfilePage() {
  redirect("/account/profile");
}
