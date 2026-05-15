import "server-only";

import type { Role } from "@/types/domain";
import { prisma } from "@/lib/db/prisma";

const activeSubscriptionStatuses = ["active", "trialing"] as const;

function hasPaidSubscriptionRecord(
  subscriptions: Array<{
    status: string;
    plan: { monthlyPrice: unknown };
    payments: Array<{ amountPaid: number }>;
  }>
) {
  return subscriptions.some((subscription) => {
    if (!activeSubscriptionStatuses.includes(subscription.status as (typeof activeSubscriptionStatuses)[number])) {
      return false;
    }

    if (subscription.payments.some((payment) => payment.amountPaid > 0)) {
      return true;
    }

    return Number(subscription.plan.monthlyPrice) > 0;
  });
}

export async function hasFounderPaidSubscription(userId: string) {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId,
      status: { in: [...activeSubscriptionStatuses] }
    },
    include: {
      plan: { select: { monthlyPrice: true } },
      payments: {
        where: {
          amountPaid: { gt: 0 }
        },
        take: 1
      }
    }
  });

  return hasPaidSubscriptionRecord(subscriptions);
}

export async function syncFounderPaymentVerification(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      fullName: true,
      email: true,
      founderProfile: { select: { verifiedAt: true, companyName: true } }
    }
  });

  if (!profile || profile.role !== "founder") {
    return false;
  }

  const isPaid = await hasFounderPaidSubscription(userId);
  const companyName = profile.founderProfile?.companyName ?? `${profile.fullName ?? profile.email.split("@")[0]}'s company`;

  await prisma.founderProfile.upsert({
    where: { userId },
    update: {
      verifiedAt: isPaid ? profile.founderProfile?.verifiedAt ?? new Date() : null
    },
    create: {
      userId,
      companyName,
      title: "Founder",
      verifiedAt: isPaid ? new Date() : null
    }
  });

  return isPaid;
}

export async function isFounderPaymentVerified(userId: string, role: Role) {
  if (role === "admin") {
    return true;
  }

  if (role !== "founder") {
    return false;
  }

  const founderProfile = await prisma.founderProfile.findUnique({
    where: { userId },
    select: { verifiedAt: true }
  });

  if (founderProfile?.verifiedAt) {
    return true;
  }

  const isPaid = await hasFounderPaidSubscription(userId);
  if (isPaid) {
    await syncFounderPaymentVerification(userId);
    return true;
  }

  return false;
}

export async function requireFounderPaymentVerified(userId: string, role: Role) {
  const verified = await isFounderPaymentVerified(userId, role);
  return verified;
}
