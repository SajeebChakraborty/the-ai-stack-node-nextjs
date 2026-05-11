import type { Role } from "@/types/domain";

const roleRank: Record<Role, number> = {
  user: 1,
  creator: 2,
  founder: 3,
  moderator: 4,
  admin: 5
};

export function canAccess(role: Role | null | undefined, minimumRole: Role) {
  if (!role) return false;
  return roleRank[role] >= roleRank[minimumRole];
}

export const permissions = {
  manageUsers: (role?: Role | null) => canAccess(role, "admin"),
  moderateContent: (role?: Role | null) => canAccess(role, "moderator"),
  claimTools: (role?: Role | null) => canAccess(role, "founder"),
  publishCreatorContent: (role?: Role | null) => canAccess(role, "creator")
};
