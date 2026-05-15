import { NextResponse } from "next/server";
import { z } from "zod";
import { syncToolEngagementMetrics } from "@/lib/analytics/tool-metrics";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

const reviewSchema = z.object({
  body: z.string().trim().min(40),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(4).max(140)
});

type Context = {
  params: Promise<{ slug: string }>;
};

function getReviewType(role: string) {
  return role === "founder" || role === "admin" ? "creator" : "user";
}

function getTrustScore(role: string) {
  switch (role) {
    case "founder":
      return 88;
    case "admin":
      return 95;
    default:
      return 72;
  }
}

export async function POST(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in before writing a review." }, { status: 401 });
  }

  if (!["user", "founder", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Your account cannot post reviews." }, { status: 403 });
  }

  const { slug } = await context.params;
  const payload = reviewSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Add a review title, rating, and at least 40 characters of buyer context." }, { status: 400 });
  }

  const tool = await prisma.tool.findUnique({
    where: {
      slug
    },
    select: {
      id: true,
      founderId: true
    }
  });

  if (!tool) {
    return NextResponse.json({ error: "Only claimed listings can accept reviews right now." }, { status: 404 });
  }

  if (tool.founderId === user.id) {
    return NextResponse.json({ error: "Founders cannot review their own claimed listing." }, { status: 403 });
  }

  const existingReview = await prisma.review.findFirst({
    where: {
      toolId: tool.id,
      authorId: user.id
    },
    select: {
      id: true
    }
  });

  if (existingReview) {
    return NextResponse.json({ error: "You already reviewed this listing." }, { status: 409 });
  }

  await prisma.review.create({
    data: {
      toolId: tool.id,
      authorId: user.id,
      reviewType: getReviewType(user.role),
      rating: payload.data.rating,
      title: payload.data.title,
      body: payload.data.body,
      trustScore: getTrustScore(user.role),
      isVerifiedReviewer: user.role !== "user"
    }
  });

  const aggregates = await prisma.review.aggregate({
    where: {
      toolId: tool.id,
      isPublished: true
    },
    _avg: {
      rating: true
    },
    _count: {
      id: true
    }
  });

  await prisma.tool.update({
    where: {
      id: tool.id
    },
    data: {
      ratingAvg: aggregates._avg.rating ?? 0,
      reviewCount: aggregates._count.id
    }
  });

  await syncToolEngagementMetrics([tool.id]);

  return NextResponse.json({
    message: "Review submitted."
  });
}
