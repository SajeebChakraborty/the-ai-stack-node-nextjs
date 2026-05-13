import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

const discussionSchema = z.object({
  body: z.string().trim().min(20),
  title: z.string().trim().min(4).max(140)
});

type Context = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in before opening a discussion." }, { status: 401 });
  }

  if (!["user", "founder", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Your account cannot open discussions." }, { status: 403 });
  }

  const { slug } = await context.params;
  const payload = discussionSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Add a title and at least 20 characters of discussion detail." }, { status: 400 });
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
    return NextResponse.json({ error: "Only claimed listings can accept discussions right now." }, { status: 404 });
  }

  if (tool.founderId === user.id) {
    return NextResponse.json({ error: "Use founder updates for your own listing instead of opening community discussions." }, { status: 403 });
  }

  const discussion = await prisma.discussion.create({
    data: {
      toolId: tool.id,
      authorId: user.id,
      title: payload.data.title,
      body: payload.data.body
    }
  });

  return NextResponse.json({
    id: discussion.id,
    message: "Discussion posted."
  });
}
