import type { Role } from "@/types/domain";

export type AdminMember = {
  id: string;
  email: string;
  name: string;
  role: Role;
  handle: string | null;
  trustScore: number;
  isVerified: boolean;
  founderPaymentVerified: boolean | null;
  suspended: boolean;
  connectedAccounts: number;
  listingsCount: number;
  createdAt: string;
  companyName: string | null;
  title: string | null;
};

export type AdminMemberUpdate = {
  fullName?: string;
  role?: Role;
  trustScore?: number;
  isVerified?: boolean;
  suspended?: boolean;
  companyName?: string;
  title?: string;
};
