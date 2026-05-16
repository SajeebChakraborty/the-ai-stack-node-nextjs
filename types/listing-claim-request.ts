import type { ListingClaimRequestStatus } from "@/types/domain";

export type ListingClaimRequestView = {
  id: string;
  status: ListingClaimRequestStatus;
  businessName: string;
  businessStartDate: string;
  businessRegistrationDate: string;
  businessDocumentUrl: string;
  additionalNotes: string | null;
  attachmentUrls: string[];
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  tool: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    logoUrl: string | null;
    founderId: string | null;
  };
  requester: {
    id: string;
    name: string;
    email: string;
  };
};
