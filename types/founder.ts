export type FounderEntitlementsView = {
  verified: boolean;
  planId: string | null;
  planName: string | null;
  claimLimit: number | null;
  claimsUsed: number;
  canClaimMore: boolean;
};
