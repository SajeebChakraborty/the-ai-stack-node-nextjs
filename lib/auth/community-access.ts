import type { CurrentUser } from "@/lib/auth/session";

export function getCommunityBlockedReason({
  currentUser,
  listingFounderId
}: {
  currentUser: CurrentUser | null;
  listingFounderId?: string | null;
}) {
  if (!currentUser) {
    return "Sign in as a user or another founder to review, discuss, and vote on this listing.";
  }

  if (listingFounderId && currentUser.id === listingFounderId) {
    return "Founders cannot review or vote on their own claimed listing. Ask a user or another founder to share proof.";
  }

  if (!["user", "founder", "admin"].includes(currentUser.role)) {
    return "Your account role cannot post community reviews or discussions yet.";
  }

  return undefined;
}
